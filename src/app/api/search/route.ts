import { prisma } from "@/lib/prisma";

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

const mapCategory = (gameType?: number): SearchResult["category"] | null => {
  if (gameType === 0) return "Main";
  if (gameType === 8) return "Remake";
  if (gameType === 11) return "Port";
  return null;
};

const fetchIgdbSearch = async (query: string) => {
  const clientId = process.env.IGDB_CLIENT_ID;
  const accessToken = process.env.IGDB_ACCESS_TOKEN;
  if (!clientId || !accessToken) {
    console.warn("search-api: IGDB env missing", {
      hasClientId: Boolean(clientId),
      hasAccessToken: Boolean(accessToken),
    });
    return [] as IgdbGame[];
  }

  const normalized = normalizeSearchQuery(query);
  if (!normalized.full) {
    return [] as IgdbGame[];
  }

  const nameMatch = buildNameMatch(normalized.full, normalized.loose);
  const whereParts = ["name != null", "game_type = (0, 8, 11)"];
  if (nameMatch) {
    whereParts.push(nameMatch);
  }

  const searchQuery = normalized.loose || normalized.full;
  const safeSearch = searchQuery.replace(/"/g, '\\"');
  const fields = "id,name,first_release_date,cover.url,game_type";
  const body = [
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

const fetchDbSearchResults = async (query: string) => {
  try {
    const dbGames = await prisma.game.findMany({
      where: {
        title: {
          contains: query,
          mode: "insensitive",
        },
        igdbId: { not: null },
      },
      select: {
        igdbId: true,
        title: true,
        releaseYear: true,
        coverUrl: true,
      },
    });

    return dbGames
      .map(mapDbSearchResult)
      .filter((game): game is SearchResult => Boolean(game));
  } catch {
    return [] as SearchResult[];
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();
    if (query.length < 2) {
      return Response.json({ ok: true, games: [] });
    }

    const [dbResults, igdbResults] = await Promise.all([
      fetchDbSearchResults(query),
      fetchIgdbSearch(query)
        .then((games) =>
          games
            .map(mapSearchResult)
            .filter((game): game is SearchResult => Boolean(game))
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
