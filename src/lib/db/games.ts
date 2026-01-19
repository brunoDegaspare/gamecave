import { readFile } from "node:fs/promises";
import path from "node:path";

export type Game = {
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

const LOCAL_DATA_PATH = path.join(process.cwd(), "data", "igdb-games.json");
let cachedGames: Game[] | null = null;

const loadLocalGames = async (): Promise<Game[]> => {
  if (cachedGames) {
    return cachedGames;
  }

  try {
    const raw = await readFile(LOCAL_DATA_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cachedGames = parsed as Game[];
      return cachedGames;
    }
  } catch {
    // Local data not available yet.
  }

  cachedGames = [];
  return cachedGames;
};

export const getGameById = async (igdbId: number): Promise<Game | null> => {
  if (!Number.isFinite(igdbId)) {
    return null;
  }

  const games = await loadLocalGames();
  const game = games.find((item) => item.igdb_id === igdbId);
  return game ?? null;
};
