import { prisma } from "@/lib/prisma";

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

const joinNames = (names: string[]) =>
  names.length > 0 ? names.join(", ") : null;

export const getGameById = async (id: number): Promise<Game | null> => {
  if (!Number.isFinite(id)) {
    return null;
  }

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      screenshots: true,
      platforms: { include: { platform: true } },
      developers: { include: { developer: true } },
      publishers: { include: { publisher: true } },
    },
  });

  if (!game) {
    return null;
  }

  const platforms = joinNames(
    game.platforms.map((entry) => entry.platform.name)
  );
  const developers = joinNames(
    game.developers.map((entry) => entry.developer.name)
  );
  const publishers = joinNames(
    game.publishers.map((entry) => entry.publisher.name)
  );

  return {
    igdb_id: game.igdbId ?? game.id,
    title: game.title,
    overview: game.overview ?? null,
    release_year: game.releaseYear > 0 ? game.releaseYear : null,
    cover_url: game.coverUrl?.trim() ? game.coverUrl : null,
    screenshots: game.screenshots.map((shot) => shot.url),
    platforms,
    developers,
    publishers,
    source: "igdb",
  };
};
