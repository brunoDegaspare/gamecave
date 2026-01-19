/* eslint-disable no-console */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type IgdbGame = {
  id: number;
  name?: string;
  summary?: string;
  first_release_date?: number;
  cover?: { url?: string };
  platforms?: Array<{ name?: string }>;
  screenshots?: Array<{ url?: string }>;
  involved_companies?: Array<{
    developer?: boolean;
    publisher?: boolean;
    company?: { name?: string };
  }>;
};

type NormalizedGame = {
  igdb_id: number;
  title: string;
  overview: string | null;
  release_year: number | null;
  cover_url: string | null;
  screenshots: string[];
  platforms: string | null;
  developers: string | null;
  publishers: string | null;
  source: "igdb";
};

const IGDB_API_URL = "https://api.igdb.com/v4/games";

const requiredEnv = ["IGDB_CLIENT_ID", "IGDB_ACCESS_TOKEN"] as const;

const env = (key: string, fallback?: string) => {
  const value = process.env[key];
  return value === undefined || value === "" ? fallback : value;
};

const parseIntEnv = (key: string, fallback: number) => {
  const value = env(key);
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });


const normalizeUrl = (url?: string) => {
  if (!url) {
    return null;
  }
  return url.startsWith("//") ? `https:${url}` : url;
};

const normalizeIgdbImageUrl = (url: string | undefined, size: string) => {
  const normalized = normalizeUrl(url);
  if (!normalized) {
    return null;
  }
  return normalized.replace("/t_thumb/", `/${size}/`);
};

const toUniqueList = (values: Array<string | undefined>) => {
  const unique = Array.from(
    new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]),
  );
  return unique.length > 0 ? unique.join(", ") : null;
};

const normalizeGame = (game: IgdbGame): NormalizedGame => {
  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getUTCFullYear()
    : null;

  const screenshots =
    game.screenshots
      ?.map((shot) => normalizeIgdbImageUrl(shot.url, "t_screenshot_big"))
      .filter(Boolean) ?? [];

  return {
    igdb_id: game.id,
    title: game.name ?? "",
    overview: game.summary ?? null,
    release_year: releaseYear,
    cover_url: normalizeIgdbImageUrl(game.cover?.url, "t_cover_big"),
    screenshots: screenshots as string[],
    platforms: toUniqueList(game.platforms?.map((p) => p.name) ?? []),
    developers: toUniqueList(
      game.involved_companies
        ?.filter((company) => company.developer)
        .map((company) => company.company?.name) ?? [],
    ),
    publishers: toUniqueList(
      game.involved_companies
        ?.filter((company) => company.publisher)
        .map((company) => company.company?.name) ?? [],
    ),
    source: "igdb",
  };
};

const buildQuery = (limit: number, offset: number) => {
  const fields =
    "id,name,summary,first_release_date,cover.url,platforms.name,screenshots.url,involved_companies.company.name,involved_companies.developer,involved_companies.publisher";
  const where = env("IGDB_WHERE", "name != null");
  const sort = env("IGDB_SORT", "id asc");

  return (
    [
      `fields ${fields}`,
      `limit ${limit}`,
      `offset ${offset}`,
      `where ${where}`,
      `sort ${sort}`,
    ].join("; ") + ";"
  );
};

const main = async () => {
  const missing = requiredEnv.filter((key) => !env(key));
  if (missing.length > 0) {
    console.error(
      `Missing env vars: ${missing.join(", ")}. Set IGDB_CLIENT_ID and IGDB_ACCESS_TOKEN.`,
    );
    process.exit(1);
  }

  const clientId = env("IGDB_CLIENT_ID") as string;
  const accessToken = env("IGDB_ACCESS_TOKEN") as string;

  const limit = parseIntEnv("IGDB_LIMIT", 100);
  const maxBatches = parseIntEnv("IGDB_MAX_BATCHES", 5);
  const startOffset = parseIntEnv("IGDB_OFFSET", 0);
  const delayMs = parseIntEnv("IGDB_RATE_LIMIT_MS", 350);
  const maxGames = parseIntEnv("IGDB_MAX_GAMES", 20);
  const outputPath = env("IGDB_OUTPUT_PATH", "data/igdb-games.json") as string;

  let totalFetched = 0;
  const collected: NormalizedGame[] = [];

  for (let batch = 0; batch < maxBatches; batch += 1) {
    const offset = startOffset + batch * limit;
    const query = buildQuery(limit, offset);

    const response = await fetch(IGDB_API_URL, {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body: query,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`IGDB request failed: ${response.status} ${body}`);
    }

    const results = (await response.json()) as IgdbGame[];
    totalFetched += results.length;
    const normalized = results.map(normalizeGame);
    const valid = normalized.filter((game) => game.title.trim().length > 0);

    for (const game of valid) {
      if (collected.length >= maxGames) {
        break;
      }
      collected.push(game);
    }

    console.log(
      `Batch ${batch + 1}/${maxBatches} fetched ${results.length} games (offset ${offset}).`,
    );
    console.log(
      "Normalized sample:",
      JSON.stringify(normalized.slice(0, 2), null, 2),
    );
    console.log(
      `Collected ${collected.length}/${maxGames} normalized games so far.`,
    );

    if (collected.length >= maxGames) {
      break;
    }

    if (results.length < limit) {
      console.log("Pagination finished (received less than limit).");
      break;
    }

    if (batch < maxBatches - 1) {
      await sleep(delayMs);
    }
  }

  const outputDir = path.dirname(outputPath);
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, JSON.stringify(collected, null, 2), "utf8");
  console.log(`Wrote ${collected.length} games to ${outputPath}.`);
  console.log(`Done. Total games fetched: ${totalFetched}.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
