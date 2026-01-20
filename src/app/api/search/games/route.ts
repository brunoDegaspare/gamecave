import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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

type SearchResult = {
  id: number;
  title: string;
};

const IGDB_API_URL = "https://api.igdb.com/v4/games";

const normalizeSearchQuery = (value: string) => {
  const lower = value.toLowerCase().trim();
  const cleaned = lower.replace(/[^a-z0-9\s]/g, " ");
  const collapsed = cleaned.replace(/\s+/g, " ").trim();
  if (!collapsed) {
    return { full: "", loose: "" };
  }

  const tokens = collapsed.split(" ");
  let looseTokens = tokens;
  if (tokens.length > 1) {
    const last = tokens[tokens.length - 1];
    const isNumber = /^\d+$/.test(last);
    const isRoman =
      /^(?:i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii|xiii|xiv|xv|xvi|xvii|xviii|xix|xx)$/i.test(
        last
      );
    if (isNumber || isRoman) {
      looseTokens = tokens.slice(0, -1);
    }
  }

  const loose = looseTokens.join(" ").trim();
  return { full: collapsed, loose: loose || collapsed };
};

const buildNameMatch = (full: string, loose: string) => {
  const patterns = new Set<string>();
  if (full) patterns.add(full);
  if (loose) patterns.add(loose);
  const escaped = (text: string) => text.replace(/"/g, '\\"');
  const clauses = Array.from(patterns).map(
    (text) => `name ~ *"${escaped(text)}"*`
  );
  return clauses.length > 0 ? `(${clauses.join(" | ")})` : "";
};

const normalizeUrl = (url?: string) => {
  if (!url) return null;
  return url.startsWith("//") ? `https:${url}` : url;
};

const normalizeIgdbImageUrl = (url: string | undefined, size: string) => {
  const normalized = normalizeUrl(url);
  if (!normalized) return null;
  return normalized.replace("/t_thumb/", `/${size}/`);
};

const toUniqueList = (values: Array<string | undefined>) =>
  Array.from(
    new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])
  );

const getOrCreatePlatform = async (name: string) => {
  const existing = await prisma.platform.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.platform.create({ data: { name } });
};

const getOrCreateDeveloper = async (name: string) => {
  const existing = await prisma.developer.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.developer.create({ data: { name } });
};

const getOrCreatePublisher = async (name: string) => {
  const existing = await prisma.publisher.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.publisher.create({ data: { name } });
};

const fetchIgdbGames = async (query: string) => {
  const clientId = process.env.IGDB_CLIENT_ID;
  const accessToken = process.env.IGDB_ACCESS_TOKEN;
  if (!clientId || !accessToken) {
    return [] as IgdbGame[];
  }

  const normalized = normalizeSearchQuery(query);
  if (!normalized.full) {
    return [] as IgdbGame[];
  }

  const nameMatch = buildNameMatch(normalized.full, normalized.loose);
  const whereParts = ["name != null", "category = (0, 8, 11)"];
  if (nameMatch) {
    whereParts.push(nameMatch);
  }
  const searchQuery = normalized.loose || normalized.full;
  const safeSearch = searchQuery.replace(/"/g, '\\"');

  const fields =
    "id,name,summary,first_release_date,cover.url,platforms.name,screenshots.url,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,popularity";
  const where = whereParts.join(" & ");
  const body = [
    `fields ${fields}`,
    `search "${safeSearch}"`,
    `where ${where}`,
    "sort popularity desc",
    "limit 30",
  ].join("; ") + ";";

  const response = await fetch(IGDB_API_URL, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body,
  });

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as IgdbGame[];
};

const persistIgdbGame = async (game: IgdbGame): Promise<SearchResult | null> => {
  const title = game.name?.trim();
  if (!title) return null;

  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getUTCFullYear()
    : 0;

  const coverUrl = normalizeIgdbImageUrl(game.cover?.url, "t_cover_big") ?? "";

  const dbGame = await prisma.game.upsert({
    where: { igdbId: game.id },
    update: {
      title,
      overview: game.summary ?? "",
      releaseYear,
      coverUrl,
    },
    create: {
      igdbId: game.id,
      title,
      overview: game.summary ?? "",
      releaseYear,
      coverUrl,
    },
  });

  const platformNames = toUniqueList(game.platforms?.map((p) => p.name) ?? []);
  const developerNames = toUniqueList(
    game.involved_companies
      ?.filter((company) => company.developer)
      .map((company) => company.company?.name) ?? []
  );
  const publisherNames = toUniqueList(
    game.involved_companies
      ?.filter((company) => company.publisher)
      .map((company) => company.company?.name) ?? []
  );

  const platforms = await Promise.all(
    platformNames.map((name) => getOrCreatePlatform(name))
  );
  const developers = await Promise.all(
    developerNames.map((name) => getOrCreateDeveloper(name))
  );
  const publishers = await Promise.all(
    publisherNames.map((name) => getOrCreatePublisher(name))
  );

  if (platforms.length > 0) {
    await prisma.gamePlatform.createMany({
      data: platforms.map((platform) => ({
        gameId: dbGame.id,
        platformId: platform.id,
      })),
      skipDuplicates: true,
    });
  }

  if (developers.length > 0) {
    await prisma.gameDeveloper.createMany({
      data: developers.map((developer) => ({
        gameId: dbGame.id,
        developerId: developer.id,
      })),
      skipDuplicates: true,
    });
  }

  if (publishers.length > 0) {
    await prisma.gamePublisher.createMany({
      data: publishers.map((publisher) => ({
        gameId: dbGame.id,
        publisherId: publisher.id,
      })),
      skipDuplicates: true,
    });
  }

  const screenshotUrls =
    game.screenshots
      ?.map((shot) => normalizeIgdbImageUrl(shot.url, "t_screenshot_big"))
      .filter(Boolean) ?? [];

  await prisma.screenshot.deleteMany({ where: { gameId: dbGame.id } });
  if (screenshotUrls.length > 0) {
    await prisma.screenshot.createMany({
      data: screenshotUrls.map((url) => ({
        gameId: dbGame.id,
        url: url as string,
      })),
    });
  }

  return { id: dbGame.id, title: dbGame.title };
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();

    if (!query) {
      return Response.json({ ok: true, games: [] });
    }

    const games = await prisma.game.findMany({
      where: {
        title: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (games.length > 0) {
      return Response.json({ ok: true, games });
    }

    try {
      const igdbGames = await fetchIgdbGames(query);
      const persisted = await Promise.all(
        igdbGames.map((game) => persistIgdbGame(game))
      );
      const results = persisted.filter(
        (game): game is SearchResult => Boolean(game)
      );
      return Response.json({ ok: true, games: results });
    } catch {
      return Response.json({ ok: true, games: [] });
    }
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { ok: false, error: "Database search failed", details },
      { status: 500 }
    );
  }
}
