import { prisma } from "@/lib/prisma";
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

const PLATFORM_MAP = [
  {
    aliases: ["ps1", "psx", "playstation 1", "playstation1"],
    igdbIds: [7],
    dbNames: ["PlayStation"],
  },
  {
    aliases: ["ps2", "playstation 2", "playstation2"],
    igdbIds: [8],
    dbNames: ["PlayStation 2"],
  },
  {
    aliases: ["ps3", "playstation 3", "playstation3"],
    igdbIds: [9],
    dbNames: ["PlayStation 3"],
  },
  {
    aliases: ["ps4", "playstation 4", "playstation4"],
    igdbIds: [48],
    dbNames: ["PlayStation 4"],
  },
  {
    aliases: ["ps5", "playstation 5", "playstation5"],
    igdbIds: [167],
    dbNames: ["PlayStation 5"],
  },
  {
    aliases: ["psp", "playstation portable"],
    igdbIds: [38],
    dbNames: ["PlayStation Portable"],
  },
  {
    aliases: ["ps vita", "psvita", "playstation vita", "vita"],
    igdbIds: [46],
    dbNames: ["PlayStation Vita"],
  },
  {
    aliases: ["psvr", "playstation vr"],
    igdbIds: [165],
    dbNames: ["PlayStation VR"],
  },
  {
    aliases: ["psvr2", "playstation vr2"],
    igdbIds: [390],
    dbNames: ["PlayStation VR2"],
  },
  {
    aliases: ["xbox original", "xbox classic"],
    igdbIds: [11],
    dbNames: ["Xbox"],
  },
  {
    aliases: ["xbox 360", "x360", "xbox360"],
    igdbIds: [12],
    dbNames: ["Xbox 360"],
  },
  {
    aliases: ["xbox one", "xone", "xbone", "xboxone"],
    igdbIds: [49],
    dbNames: ["Xbox One"],
  },
  {
    aliases: [
      "xbox series",
      "xbox series x",
      "xbox series s",
      "xbox series x s",
      "xbox series xs",
      "series x",
      "series s",
    ],
    igdbIds: [169],
    dbNames: ["Xbox Series X|S"],
  },
  {
    aliases: ["switch", "nintendo switch"],
    igdbIds: [130],
    dbNames: ["Nintendo Switch"],
  },
  {
    aliases: ["switch 2", "nintendo switch 2"],
    igdbIds: [508],
    dbNames: ["Nintendo Switch 2"],
  },
  {
    aliases: ["wii u", "wiiu"],
    igdbIds: [41],
    dbNames: ["Wii U"],
  },
  {
    aliases: ["wii"],
    igdbIds: [5],
    dbNames: ["Wii"],
  },
  {
    aliases: ["gamecube", "game cube", "nintendo gamecube"],
    igdbIds: [21],
    dbNames: ["Nintendo GameCube"],
  },
  {
    aliases: ["n64", "nintendo 64"],
    igdbIds: [4],
    dbNames: ["Nintendo 64"],
  },
  {
    aliases: ["nes", "nintendo entertainment system", "nintendo nes"],
    igdbIds: [18],
    dbNames: ["Nintendo Entertainment System"],
  },
  {
    aliases: ["famicom disk system", "fds"],
    igdbIds: [51],
    dbNames: ["Family Computer Disk System"],
  },
  {
    aliases: ["snes", "super nintendo", "super nintendo entertainment system"],
    igdbIds: [19],
    dbNames: ["Super Nintendo Entertainment System"],
  },
  {
    aliases: [
      "snes cd",
      "super nes cd",
      "super nes cd rom",
      "super nintendo cd",
    ],
    igdbIds: [131],
    dbNames: ["Super NES CD-ROM System"],
  },
  {
    aliases: ["3ds", "nintendo 3ds"],
    igdbIds: [37],
    dbNames: ["Nintendo 3DS"],
  },
  {
    aliases: ["new 3ds", "new nintendo 3ds"],
    igdbIds: [137],
    dbNames: ["New Nintendo 3DS"],
  },
  {
    aliases: ["ds", "nds", "nintendo ds"],
    igdbIds: [20],
    dbNames: ["Nintendo DS"],
  },
  {
    aliases: ["dsi", "nintendo dsi"],
    igdbIds: [159],
    dbNames: ["Nintendo DSi"],
  },
  {
    aliases: ["game boy", "gameboy", "gb"],
    igdbIds: [33],
    dbNames: ["Game Boy"],
  },
  {
    aliases: ["game boy color", "gameboy color", "gbc"],
    igdbIds: [22],
    dbNames: ["Game Boy Color"],
  },
  {
    aliases: ["game boy advance", "gameboy advance", "gba"],
    igdbIds: [24],
    dbNames: ["Game Boy Advance"],
  },
  {
    aliases: ["64dd", "nintendo 64dd"],
    igdbIds: [416],
    dbNames: ["64DD"],
  },
  {
    aliases: ["game and watch", "game watch", "g and w"],
    igdbIds: [307],
    dbNames: ["Game & Watch"],
  },
  {
    aliases: ["mega drive", "megadrive", "genesis", "sega genesis"],
    igdbIds: [29],
    dbNames: ["Sega Mega Drive/Genesis"],
  },
  {
    aliases: ["master system", "sega master system", "sms", "mark iii"],
    igdbIds: [64],
    dbNames: ["Sega Master System/Mark III"],
  },
  {
    aliases: ["saturn", "sega saturn"],
    igdbIds: [32],
    dbNames: ["Sega Saturn"],
  },
  {
    aliases: ["dreamcast", "sega dreamcast"],
    igdbIds: [23],
    dbNames: ["Dreamcast"],
  },
  {
    aliases: ["game gear", "sega game gear", "gg"],
    igdbIds: [35],
    dbNames: ["Sega Game Gear"],
  },
  {
    aliases: ["atari 2600"],
    igdbIds: [59],
    dbNames: ["Atari 2600"],
  },
  {
    aliases: ["atari 5200"],
    igdbIds: [66],
    dbNames: ["Atari 5200"],
  },
  {
    aliases: ["atari 7800"],
    igdbIds: [60],
    dbNames: ["Atari 7800"],
  },
  {
    aliases: ["atari 8 bit", "atari 8bit"],
    igdbIds: [65],
    dbNames: ["Atari 8-bit"],
  },
  {
    aliases: ["atari jaguar"],
    igdbIds: [62],
    dbNames: ["Atari Jaguar"],
  },
  {
    aliases: ["atari jaguar cd"],
    igdbIds: [410],
    dbNames: ["Atari Jaguar CD"],
  },
  {
    aliases: ["atari lynx"],
    igdbIds: [61],
    dbNames: ["Atari Lynx"],
  },
  {
    aliases: ["atari st", "atari ste"],
    igdbIds: [63],
    dbNames: ["Atari ST/STE"],
  },
  {
    aliases: ["neo geo aes", "aes"],
    igdbIds: [80],
    dbNames: ["Neo Geo AES"],
  },
  {
    aliases: ["neo geo mvs", "mvs"],
    igdbIds: [79],
    dbNames: ["Neo Geo MVS"],
  },
  {
    aliases: ["neo geo cd"],
    igdbIds: [136],
    dbNames: ["Neo Geo CD"],
  },
  {
    aliases: ["neo geo pocket", "ngp"],
    igdbIds: [119],
    dbNames: ["Neo Geo Pocket"],
  },
  {
    aliases: ["neo geo pocket color", "neo geo pocket colour", "ngpc"],
    igdbIds: [120],
    dbNames: ["Neo Geo Pocket Color"],
  },
  {
    aliases: ["hyper neo geo", "hyper neo geo 64"],
    igdbIds: [135],
    dbNames: ["Hyper Neo Geo 64"],
  },
  {
    aliases: ["turbografx", "turbografx 16", "turbografx16", "pc engine"],
    igdbIds: [86],
    dbNames: ["TurboGrafx-16/PC Engine"],
  },
  {
    aliases: [
      "turbografx cd",
      "turbografx 16 cd",
      "turbografx16 cd",
      "pc engine cd",
    ],
    igdbIds: [150],
    dbNames: ["Turbografx-16/PC Engine CD"],
  },
  {
    aliases: ["supergrafx", "pc engine supergrafx"],
    igdbIds: [128],
    dbNames: ["PC Engine SuperGrafx"],
  },
  {
    aliases: ["pc", "windows", "pc windows"],
    igdbIds: [6],
    dbNames: ["PC (Microsoft Windows)"],
  },
  {
    aliases: ["mac", "macos", "osx"],
    igdbIds: [14],
    dbNames: ["Mac"],
  },
  {
    aliases: ["linux"],
    igdbIds: [3],
    dbNames: ["Linux"],
  },
  {
    aliases: ["android"],
    igdbIds: [34],
    dbNames: ["Android"],
  },
  {
    aliases: ["ios", "iphone", "ipad", "ipod"],
    igdbIds: [39],
    dbNames: ["iOS"],
  },
  {
    aliases: ["windows phone", "win phone"],
    igdbIds: [74],
    dbNames: ["Windows Phone"],
  },
  {
    aliases: ["windows mobile"],
    igdbIds: [405],
    dbNames: ["Windows Mobile"],
  },
  {
    aliases: ["windows mixed reality", "wmr"],
    igdbIds: [161],
    dbNames: ["Windows Mixed Reality"],
  },
  {
    aliases: ["steamvr", "steam vr"],
    igdbIds: [163],
    dbNames: ["SteamVR"],
  },
  {
    aliases: ["stadia", "google stadia"],
    igdbIds: [170],
    dbNames: ["Google Stadia"],
  },
  {
    aliases: ["c64", "commodore 64"],
    igdbIds: [15],
    dbNames: ["Commodore C64/128/MAX"],
  },
  {
    aliases: ["amstrad cpc"],
    igdbIds: [25],
    dbNames: ["Amstrad CPC"],
  },
  {
    aliases: ["amstrad pcw"],
    igdbIds: [154],
    dbNames: ["Amstrad PCW"],
  },
  {
    aliases: ["dragon 32", "dragon 64", "dragon 32 64"],
    igdbIds: [153],
    dbNames: ["Dragon 32/64"],
  },
  {
    aliases: ["pc fx", "pcfx"],
    igdbIds: [274],
    dbNames: ["PC-FX"],
  },
  {
    aliases: ["pc 6000", "nec pc 6000"],
    igdbIds: [157],
    dbNames: ["NEC PC-6000 Series"],
  },
  {
    aliases: ["pc 8800", "nec pc 8800"],
    igdbIds: [125],
    dbNames: ["PC-8800 Series"],
  },
  {
    aliases: ["pc 9800", "nec pc 9800"],
    igdbIds: [149],
    dbNames: ["PC-9800 Series"],
  },
  {
    aliases: ["ps", "playstation", "sony"],
    igdbIds: [7, 8, 9, 48, 167, 38, 46, 165, 390],
    dbNames: [
      "PlayStation",
      "PlayStation 2",
      "PlayStation 3",
      "PlayStation 4",
      "PlayStation 5",
      "PlayStation Portable",
      "PlayStation Vita",
      "PlayStation VR",
      "PlayStation VR2",
    ],
  },
  {
    aliases: ["xbox", "microsoft xbox"],
    igdbIds: [11, 12, 49, 169],
    dbNames: ["Xbox", "Xbox 360", "Xbox One", "Xbox Series X|S"],
  },
  {
    aliases: ["nintendo"],
    igdbIds: [
      4, 5, 18, 19, 20, 21, 33, 22, 24, 37, 41, 51, 130, 137, 159, 416, 508,
    ],
    dbNames: [
      "Nintendo 64",
      "Wii",
      "Nintendo Entertainment System",
      "Super Nintendo Entertainment System",
      "Nintendo DS",
      "Nintendo GameCube",
      "Game Boy",
      "Game Boy Color",
      "Game Boy Advance",
      "Nintendo 3DS",
      "Wii U",
      "Family Computer Disk System",
      "Nintendo Switch",
      "New Nintendo 3DS",
      "Nintendo DSi",
      "64DD",
      "Nintendo Switch 2",
    ],
  },
  {
    aliases: ["sega"],
    igdbIds: [23, 29, 32, 35, 64],
    dbNames: [
      "Dreamcast",
      "Sega Mega Drive/Genesis",
      "Sega Saturn",
      "Sega Game Gear",
      "Sega Master System/Mark III",
    ],
  },
  {
    aliases: ["atari"],
    igdbIds: [59, 60, 61, 62, 63, 65, 66, 410],
    dbNames: [
      "Atari 2600",
      "Atari 7800",
      "Atari Lynx",
      "Atari Jaguar",
      "Atari ST/STE",
      "Atari 8-bit",
      "Atari 5200",
      "Atari Jaguar CD",
    ],
  },
  {
    aliases: ["neo geo", "neogeo"],
    igdbIds: [79, 80, 119, 120, 135, 136],
    dbNames: [
      "Neo Geo MVS",
      "Neo Geo AES",
      "Neo Geo Pocket",
      "Neo Geo Pocket Color",
      "Hyper Neo Geo 64",
      "Neo Geo CD",
    ],
  },
  {
    aliases: ["turbografx", "pc engine", "nec"],
    igdbIds: [86, 128, 150],
    dbNames: [
      "TurboGrafx-16/PC Engine",
      "PC Engine SuperGrafx",
      "Turbografx-16/PC Engine CD",
    ],
  },
  {
    aliases: ["mobile", "smartphone"],
    igdbIds: [34, 39, 74, 405],
    dbNames: ["Android", "iOS", "Windows Phone", "Windows Mobile"],
  },
];

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

const scoreTitleMatch = (
  title: string,
  normalizedQuery: string,
  tokens: string[],
) => {
  const normalizedTitle = normalizeText(title);
  if (!normalizedTitle) return 0;

  let score = 0;
  if (normalizedTitle === normalizedQuery) {
    score += 1000;
  } else if (normalizedTitle.startsWith(normalizedQuery)) {
    score += 600;
  } else if (normalizedTitle.includes(normalizedQuery)) {
    score += 300;
  }

  const titleTokens = normalizedTitle.split(" ");
  for (const token of tokens) {
    if (titleTokens.includes(token)) {
      score += 30;
    } else if (titleTokens.some((part) => part.startsWith(token))) {
      score += 20;
    } else if (normalizedTitle.includes(token)) {
      score += 10;
    }
  }

  return score;
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

    const andClauses: Prisma.GameWhereInput[] = tokens.map((token) => ({
      title: {
        contains: token,
        mode: "insensitive",
      },
    }));

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
      AND: andClauses,
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
      .map((game) => ({
        game,
        score: scoreTitleMatch(game.title, normalizedQuery, tokens),
      }))
      .sort((a, b) => {
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
