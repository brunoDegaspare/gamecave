import { prisma } from "@/lib/prisma";
import { PLATFORM_MAP } from "@/lib/search/platform-map";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

type IgdbGame = {
  id: number;
  name?: string;
  first_release_date?: number;
  cover?: { url?: string };
  category?: number;
  version_parent?: number;
};

type SearchResult = {
  igdbId: number;
  title: string;
  releaseYear: number | null;
  coverUrl: string | null;
  category: "Main" | "Remake" | "Port" | "Expanded" | "Game";
};

const IGDB_API_URL = "https://api.igdb.com/v4/games";
const IGDB_ALLOWED_CATEGORIES = [0, 8, 10, 11];

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

const mapCategory = (category?: number): SearchResult["category"] | null => {
  if (category === 0) return "Main";
  if (category === 8) return "Remake";
  if (category === 10) return "Expanded";
  if (category === 11) return "Port";
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
    return { games: [] as IgdbGame[], requestBody: null as string | null };
  }

  if (!normalizedQuery) {
    return { games: [] as IgdbGame[], requestBody: null as string | null };
  }

  const whereParts: string[] = [];
  if (platformIds.length > 0) {
    whereParts.push(`platforms = (${platformIds.join(",")})`);
  }
  const safeSearch = normalizedQuery.replace(/"/g, '\\"');
  const fields = "id,name,first_release_date,cover.url,category,version_parent";
  const body =
    [
      `fields ${fields}`,
      `search "${safeSearch}"`,
      ...(whereParts.length > 0 ? [`where ${whereParts.join(" & ")}`] : []),
      "limit 50",
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
    return { games: [] as IgdbGame[], requestBody: body };
  }

  return {
    games: (await response.json()) as IgdbGame[],
    requestBody: body,
  };
};

const mapIgdbResults = (games: IgdbGame[]) => {
  const results: SearchResult[] = [];

  for (const game of games) {
    const title = game.name?.trim();
    if (!title) {
      continue;
    }
    let category: SearchResult["category"] | null = null;
    if (typeof game.category === "number") {
      category = mapCategory(game.category);
      if (!category) {
        continue;
      }
    } else {
      category = "Game";
    }

    const releaseYear = game.first_release_date
      ? new Date(game.first_release_date * 1000).getUTCFullYear()
      : null;
    const coverUrl = normalizeIgdbImageUrl(game.cover?.url, "t_cover_big");

    results.push({
      igdbId: game.id,
      title,
      releaseYear,
      coverUrl,
      category,
    });
  }

  return results;
};

const rankIgdbResults = (
  games: SearchResult[],
  normalizedQuery: string,
  tokens: string[],
) => {
  if (games.length <= 1) return games;
  const query = normalizedQuery.trim();
  if (!query) return games;

  const noiseTerms = new Set([
    "wave",
    "booster",
    "course",
    "pass",
    "bundle",
    "pack",
  ]);

  return games
    .map((game, index) => {
      const normalizedTitle = normalizeText(game.title);
      const titleTokens = normalizedTitle.split(" ").filter(Boolean);
      const exactMatch = normalizedTitle === query;
      const hasAllTokens =
        tokens.length > 0 && tokens.every((token) => titleTokens.includes(token));
      const startsWithQuery = normalizedTitle.startsWith(query);
      const containsQuery = normalizedTitle.includes(query);
      const isNoisy =
        normalizedTitle.includes("course pass") ||
        titleTokens.some((token) => noiseTerms.has(token));

      let rank = 4;
      if (exactMatch) {
        rank = 0;
      } else if (hasAllTokens) {
        rank = 1;
      } else if (startsWithQuery) {
        rank = 2;
      } else if (containsQuery) {
        rank = 3;
      }

      return { game, rank, isNoisy, index };
    })
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (a.isNoisy !== b.isNoisy) return a.isNoisy ? 1 : -1;
      return a.index - b.index;
    })
    .map(({ game }) => game);
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

    const [dbResults, igdbResponse] = await Promise.all([
      fetchDbSearchResults(
        normalized.query,
        normalized.tokens,
        normalized.platformNames,
      ),
      fetchIgdbSearch(normalized.query, normalized.platformIds).catch(() => ({
        games: [] as IgdbGame[],
        requestBody: null as string | null,
      })),
    ]);
    const rawIgdbResults = igdbResponse.games;

    const igdbResults = rankIgdbResults(
      mapIgdbResults(rawIgdbResults),
      normalized.query,
      normalized.tokens,
    );

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
