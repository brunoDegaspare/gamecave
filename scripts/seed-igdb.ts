/* eslint-disable no-console */

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

type DbClient = {
  query: <T = unknown>(
    sql: string,
    params?: Array<unknown>,
  ) => Promise<{ rows: T[] }>;
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

// Provide a DB client with a `query(sql, params)` method before running.
const getDbClient = (): DbClient => {
  const db = (globalThis as { gamecaveDb?: DbClient }).gamecaveDb;
  if (!db) {
    throw new Error(
      "Missing database client. Set globalThis.gamecaveDb with a query(sql, params) function.",
    );
  }
  return db;
};

const getDialect = () => {
  const value = env("DB_DIALECT", "postgres");
  return value === "sqlite" ? "sqlite" : "postgres";
};

const placeholder = (index: number, dialect: "postgres" | "sqlite") =>
  dialect === "sqlite" ? "?" : `$${index}`;

const makePlaceholders = (count: number, dialect: "postgres" | "sqlite") =>
  Array.from({ length: count }, (_, i) => placeholder(i + 1, dialect)).join(
    ", ",
  );

const normalizeUrl = (url?: string) => {
  if (!url) {
    return null;
  }
  return url.startsWith("//") ? `https:${url}` : url;
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
    game.screenshots?.map((shot) => normalizeUrl(shot.url)).filter(Boolean) ??
    [];

  return {
    igdb_id: game.id,
    title: game.name ?? "",
    overview: game.summary ?? null,
    release_year: releaseYear,
    cover_url: normalizeUrl(game.cover?.url),
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

const upsertGame = async (
  db: DbClient,
  game: NormalizedGame,
  dialect: "postgres" | "sqlite",
) => {
  const existsQuery = `select 1 as exists from games where igdb_id = ${placeholder(
    1,
    dialect,
  )} limit 1`;
  const existsResult = await db.query<{ exists: number }>(existsQuery, [
    game.igdb_id,
  ]);
  const existed = existsResult.rows.length > 0;

  const columns = [
    "igdb_id",
    "title",
    "overview",
    "release_year",
    "cover_url",
    "screenshots",
    "platforms",
    "developers",
    "publishers",
    "source",
  ];
  const values = [
    game.igdb_id,
    game.title,
    game.overview,
    game.release_year,
    game.cover_url,
    game.screenshots,
    game.platforms,
    game.developers,
    game.publishers,
    game.source,
  ];
  const placeholders = makePlaceholders(values.length, dialect);
  const updates = columns
    .filter((column) => column !== "igdb_id")
    .map((column) => `${column} = excluded.${column}`)
    .join(", ");

  const upsertSql = `insert into games (${columns.join(
    ", ",
  )}) values (${placeholders}) on conflict (igdb_id) do update set ${updates}`;

  await db.query(upsertSql, values);

  return existed ? "updated" : "inserted";
};

const persistBatch = async (
  db: DbClient,
  games: NormalizedGame[],
  dialect: "postgres" | "sqlite",
) => {
  let inserted = 0;
  let updated = 0;

  for (const game of games) {
    try {
      const action = await upsertGame(db, game, dialect);
      if (action === "inserted") {
        inserted += 1;
      } else {
        updated += 1;
      }
    } catch (error) {
      console.error(
        `Failed to upsert IGDB ${game.igdb_id} (${game.title}).`,
        error,
      );
    }
  }

  return { inserted, updated };
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
  const db = getDbClient();
  const dialect = getDialect();

  const limit = parseIntEnv("IGDB_LIMIT", 100);
  const maxBatches = parseIntEnv("IGDB_MAX_BATCHES", 5);
  const startOffset = parseIntEnv("IGDB_OFFSET", 0);
  const delayMs = parseIntEnv("IGDB_RATE_LIMIT_MS", 350);

  let totalFetched = 0;

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
    const persisted = await persistBatch(db, normalized, dialect);

    console.log(
      `Batch ${batch + 1}/${maxBatches} fetched ${results.length} games (offset ${offset}).`,
    );
    console.log(
      "Normalized sample:",
      JSON.stringify(normalized.slice(0, 2), null, 2),
    );
    console.log(
      `Persisted batch: inserted ${persisted.inserted}, updated ${persisted.updated}.`,
    );

    if (results.length < limit) {
      console.log("Pagination finished (received less than limit).");
      break;
    }

    if (batch < maxBatches - 1) {
      await sleep(delayMs);
    }
  }

  console.log(`Done. Total games fetched: ${totalFetched}.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
