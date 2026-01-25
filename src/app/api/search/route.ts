import { prisma } from "@/lib/prisma";
import { PLATFORM_MAP } from "@/lib/search/platform-map";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

type IgdbGame = {
  id: number;
  name?: string;
  first_release_date?: number;
  cover?: { url?: string };
  game_type?: number;
};

type SearchResult = {
  igdbId: number;
  title: string;
  releaseYear: number | null;
  coverUrl: string | null;
  category: "Main" | "Remake" | "Port";
};

const IGDB_API_URL = "https://api.igdb.com/v4/games";

const normalizeText = (value: string) => {
  const lower = value.toLowerCase();
  const withAnd = lower.replace(/&/g, " and ");
  const cleaned = withAnd.replace(/[^a-z0-9\s]/g, " ");
  return cleaned.replace(/\s+/g, " ").trim();
};

const normalizeSearchQuery = (value: string) => {
  const normalized = normalizeText(value);
  const rawTokens = normalized ? normalized.split(" ").filter(Boolean) : [];
  const consumed = new Array(rawTokens.length).fill(false);
  const platformIds = new Set<number>();
  const platformNames = new Set<string>();

  const aliasEntries = PLATFORM_MAP.flatMap((entry) =>
    entry.aliases.map((alias) => ({
      aliasTokens: alias.split(" "),
      igdbIds: entry.igdbIds,
      dbNames: entry.dbNames,
    })),
  ).sort((a, b) => b.aliasTokens.length - a.aliasTokens.length);

  for (const entry of aliasEntries) {
    const { aliasTokens } = entry;
    if (aliasTokens.length === 0) continue;
    for (let i = 0; i <= rawTokens.length - aliasTokens.length; i += 1) {
      if (consumed.slice(i, i + aliasTokens.length).some(Boolean)) {
        continue;
      }
      const matches = aliasTokens.every(
        (token, index) => rawTokens[i + index] === token,
      );
      if (!matches) continue;
      for (let j = 0; j < aliasTokens.length; j += 1) {
        consumed[i + j] = true;
      }
      entry.igdbIds.forEach((id) => platformIds.add(id));
      entry.dbNames.forEach((name) => platformNames.add(name));
    }
  }

  const textTokens = rawTokens.filter((_, index) => !consumed[index]);
  const query = textTokens.join(" ").trim();
  const tokens = Array.from(new Set(textTokens));

  return {
    query,
    tokens,
    platformIds: Array.from(platformIds),
    platformNames: Array.from(platformNames),
  };
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

const mapCategory = (gameType?: number): SearchResult["category"] | null => {
  if (gameType === 0) return "Main";
  if (gameType === 8) return "Remake";
  if (gameType === 11) return "Port";
  return null;
};

const fetchIgdbSearch = async (
  normalizedQuery: string,
  platformIds: number[],
) => {
  const clientId = process.env.IGDB_CLIENT_ID;
  const accessToken = process.env.IGDB_ACCESS_TOKEN;
  if (!clientId || !accessToken) {
    console.warn("search-api: IGDB env missing", {
      hasClientId: Boolean(clientId),
      hasAccessToken: Boolean(accessToken),
    });
    return [] as IgdbGame[];
  }

  if (!normalizedQuery) {
    return [] as IgdbGame[];
  }

  const whereParts = ["name != null", "game_type = (0, 8, 11)"];
  if (platformIds.length > 0) {
    whereParts.push(`platforms = (${platformIds.join(",")})`);
  }
  const safeSearch = normalizedQuery.replace(/"/g, '\\"');
  const fields = "id,name,first_release_date,cover.url,game_type";
  const body =
    [
      `fields ${fields}`,
      `search "${safeSearch}"`,
      `where ${whereParts.join(" & ")}`,
      "limit 20",
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

  console.info("search-api: IGDB response", {
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) {
    return [] as IgdbGame[];
  }

  return (await response.json()) as IgdbGame[];
};

const mapSearchResult = (game: IgdbGame): SearchResult | null => {
  const title = game.name?.trim();
  if (!title) return null;
  const category = mapCategory(game.game_type);
  if (!category) return null;

  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getUTCFullYear()
    : null;
  const coverUrl = normalizeIgdbImageUrl(game.cover?.url, "t_cover_big");

  return {
    igdbId: game.id,
    title,
    releaseYear,
    coverUrl,
    category,
  };
};

const evaluateTitleMatch = (
  title: string,
  normalizedQuery: string,
  tokens: string[],
) => {
  const normalizedTitle = normalizeText(title);
  if (!normalizedTitle) {
    return { score: 0, matchCount: 0 };
  }

  let score = 0;
  if (normalizedTitle === normalizedQuery) {
    score += 1000;
  } else if (normalizedTitle.startsWith(normalizedQuery)) {
    score += 600;
  } else if (normalizedTitle.includes(normalizedQuery)) {
    score += 300;
  }

  const titleTokens = normalizedTitle.split(" ");
  let matchCount = 0;
  for (const token of tokens) {
    let matched = false;
    if (titleTokens.includes(token)) {
      score += 30;
      matched = true;
    } else if (titleTokens.some((part) => part.startsWith(token))) {
      score += 20;
      matched = true;
    } else if (normalizedTitle.includes(token)) {
      score += 10;
      matched = true;
    }
    if (matched) {
      matchCount += 1;
    }
  }

  return { score, matchCount };
};

const mapDbSearchResult = (game: {
  igdbId: number | null;
  title: string;
  releaseYear: number;
  coverUrl: string;
}): SearchResult | null => {
  if (!game.igdbId) return null;
  const title = game.title.trim();
  if (!title) return null;

  const releaseYear = game.releaseYear > 0 ? game.releaseYear : null;
  const coverUrl = game.coverUrl.trim() ? game.coverUrl : null;

  return {
    igdbId: game.igdbId,
    title,
    releaseYear,
    coverUrl,
    category: "Main",
  };
};

const fetchDbSearchResults = async (
  normalizedQuery: string,
  tokens: string[],
  platformNames: string[],
) => {
  try {
    if (tokens.length === 0) {
      return [] as SearchResult[];
    }

    const tokenClauses: Prisma.GameWhereInput[] = tokens.map((token) => ({
      title: {
        contains: token,
        mode: "insensitive",
      },
    }));

    const andClauses: Prisma.GameWhereInput[] = [];

    if (platformNames.length > 0) {
      andClauses.push({
        platforms: {
          some: {
            platform: {
              name: {
                in: platformNames,
                mode: "insensitive",
              },
            },
          },
        },
      });
    }

    const where: Prisma.GameWhereInput = {
      igdbId: { not: null },
      AND: [
        ...andClauses,
        {
          OR: tokenClauses,
        },
      ],
    };

    const dbGames = await prisma.game.findMany({
      where,
      select: {
        igdbId: true,
        title: true,
        releaseYear: true,
        coverUrl: true,
      },
    });

    const scored = dbGames
      .map(mapDbSearchResult)
      .filter((game): game is SearchResult => Boolean(game))
      .map((game) => {
        const { score, matchCount } = evaluateTitleMatch(
          game.title,
          normalizedQuery,
          tokens,
        );
        return { game, score, matchCount };
      })
      .sort((a, b) => {
        if (a.matchCount !== b.matchCount) {
          return b.matchCount - a.matchCount;
        }
        if (a.score !== b.score) return b.score - a.score;
        return a.game.title.localeCompare(b.game.title);
      })
      .map(({ game }) => game);

    return scored;
  } catch {
    return [] as SearchResult[];
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = (searchParams.get("q") || "").trim();
    if (rawQuery.length < 2) {
      return Response.json({ ok: true, games: [] });
    }

    const normalized = normalizeSearchQuery(rawQuery);
    if (normalized.query.length < 2 || normalized.tokens.length === 0) {
      return Response.json({ ok: true, games: [] });
    }

    const [dbResults, igdbResults] = await Promise.all([
      fetchDbSearchResults(
        normalized.query,
        normalized.tokens,
        normalized.platformNames,
      ),
      fetchIgdbSearch(normalized.query, normalized.platformIds)
        .then((games) =>
          games
            .map(mapSearchResult)
            .filter((game): game is SearchResult => Boolean(game)),
        )
        .catch(() => [] as SearchResult[]),
    ]);

    const seen = new Set<number>();
    const merged: SearchResult[] = [];

    for (const game of dbResults) {
      if (seen.has(game.igdbId)) continue;
      seen.add(game.igdbId);
      merged.push(game);
    }

    for (const game of igdbResults) {
      if (seen.has(game.igdbId)) continue;
      seen.add(game.igdbId);
      merged.push(game);
    }

    return Response.json({ ok: true, games: merged });
  } catch {
    return Response.json({ ok: true, games: [] });
  }
}
