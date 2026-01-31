import { AuthError, resolveAuthenticatedUser } from "@/lib/auth/resolve-user";
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

type AddGamePayload = {
  igdbId?: number;
};

type RemoveGamePayload = {
  gameId?: number;
  igdbId?: number;
};

const IGDB_API_URL = "https://api.igdb.com/v4/games";

const parseCollectionId = (raw: string | undefined) => {
  if (!raw) return null;
  if (!/^\d+$/.test(raw)) return null;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const parseIgdbId = (raw: number | undefined) => {
  if (!raw || !Number.isFinite(raw)) return null;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const parseGameId = (raw: number | undefined) => {
  if (!raw || !Number.isFinite(raw)) return null;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const normalizeUrl = (url?: string) => {
  if (!url) return null;
  return url.startsWith("//") ? `https:${url}` : url;
};

const normalizeIgdbImageUrl = (url: string | undefined, size: string) => {
  const normalized = normalizeUrl(url);
  if (!normalized) return null;
  if (normalized.includes("/t_")) {
    return normalized.replace(/\/t_[^/]+\//, `/${size}/`);
  }
  return normalized;
};

const toUniqueList = (values: Array<string | undefined>) =>
  Array.from(
    new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]),
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

const fetchIgdbGameById = async (igdbId: number) => {
  const clientId = process.env.IGDB_CLIENT_ID;
  const accessToken = process.env.IGDB_ACCESS_TOKEN;
  if (!clientId || !accessToken) {
    throw new Error("IGDB credentials are missing.");
  }

  const fields =
    "id,name,summary,first_release_date,cover.url,platforms.name,screenshots.url,involved_companies.company.name,involved_companies.developer,involved_companies.publisher";
  const body = `fields ${fields}; where id = ${igdbId}; limit 1;`;

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
    throw new Error(
      `IGDB request failed with status ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as IgdbGame[];
  return data[0] ?? null;
};

const persistIgdbGame = async (game: IgdbGame) => {
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
      .map((company) => company.company?.name) ?? [],
  );
  const publisherNames = toUniqueList(
    game.involved_companies
      ?.filter((company) => company.publisher)
      .map((company) => company.company?.name) ?? [],
  );

  const platforms = await Promise.all(
    platformNames.map((name) => getOrCreatePlatform(name)),
  );
  const developers = await Promise.all(
    developerNames.map((name) => getOrCreateDeveloper(name)),
  );
  const publishers = await Promise.all(
    publisherNames.map((name) => getOrCreatePublisher(name)),
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

  await prisma.screenshot.deleteMany({ where: { gameId: dbGame.id } });
  const screenshots = toUniqueList(game.screenshots?.map((s) => s.url) ?? [])
    .map((url) => normalizeIgdbImageUrl(url, "t_screenshot_big"))
    .filter(Boolean) as string[];

  if (screenshots.length > 0) {
    await prisma.screenshot.createMany({
      data: screenshots.map((url) => ({
        gameId: dbGame.id,
        url,
      })),
      skipDuplicates: true,
    });
  }

  return dbGame;
};

const toAuthResponse = (error: AuthError) =>
  Response.json({ error: error.message, code: error.code }, { status: error.status });

const toServerError = (error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  return Response.json(
    { error: "Internal server error", details: message },
    { status: 500 },
  );
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ collectionId?: string }> },
) {
  try {
    const user = await resolveAuthenticatedUser(request);
    const { collectionId: rawCollectionId } = await params;
    const collectionId = parseCollectionId(rawCollectionId);
    if (!collectionId) {
      return Response.json({ error: "Invalid collection id." }, { status: 400 });
    }

    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId: user.id },
      select: { id: true },
    });
    if (!collection) {
      return Response.json({ error: "Collection not found." }, { status: 404 });
    }

    let payload: AddGamePayload;
    try {
      payload = (await request.json()) as AddGamePayload;
    } catch {
      return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const igdbId = parseIgdbId(payload.igdbId);
    if (!igdbId) {
      return Response.json({ error: "Invalid igdbId." }, { status: 400 });
    }

    let game = await prisma.game.findUnique({ where: { igdbId } });
    if (!game) {
      const igdbGame = await fetchIgdbGameById(igdbId);
      if (!igdbGame) {
        return Response.json({ error: "Game not found." }, { status: 404 });
      }
      game = await persistIgdbGame(igdbGame);
    }

    if (!game) {
      return Response.json({ error: "Game not found." }, { status: 404 });
    }

    const existingLink = await prisma.collectionGame.findUnique({
      where: {
        collectionId_gameId: {
          collectionId,
          gameId: game.id,
        },
      },
    });

    if (existingLink) {
      return Response.json(
        {
          collectionId,
          game: {
            id: game.id,
            igdbId: game.igdbId,
            title: game.title,
            coverUrl: game.coverUrl,
            releaseYear: game.releaseYear,
          },
          addedAt: existingLink.addedAt,
          alreadyExists: true,
        },
        { status: 200 },
      );
    }

    const link = await prisma.collectionGame.create({
      data: { collectionId, gameId: game.id },
    });

    return Response.json(
      {
        collectionId,
        game: {
          id: game.id,
          igdbId: game.igdbId,
          title: game.title,
          coverUrl: game.coverUrl,
          releaseYear: game.releaseYear,
        },
        addedAt: link.addedAt,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return toAuthResponse(error);
    }
    return toServerError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ collectionId?: string }> },
) {
  try {
    const user = await resolveAuthenticatedUser(request);
    const { collectionId: rawCollectionId } = await params;
    const collectionId = parseCollectionId(rawCollectionId);
    if (!collectionId) {
      return Response.json({ error: "Invalid collection id." }, { status: 400 });
    }

    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId: user.id },
      select: { id: true },
    });
    if (!collection) {
      return Response.json({ error: "Collection not found." }, { status: 404 });
    }

    let payload: RemoveGamePayload;
    try {
      payload = (await request.json()) as RemoveGamePayload;
    } catch {
      return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    let gameId = parseGameId(payload.gameId);
    if (!gameId) {
      const igdbId = parseIgdbId(payload.igdbId);
      if (!igdbId) {
        return Response.json({ error: "Invalid game id." }, { status: 400 });
      }
      const game = await prisma.game.findUnique({
        where: { igdbId },
        select: { id: true },
      });
      if (!game) {
        return Response.json({ error: "Game not found." }, { status: 404 });
      }
      gameId = game.id;
    }

    const existingLink = await prisma.collectionGame.findUnique({
      where: {
        collectionId_gameId: {
          collectionId,
          gameId,
        },
      },
    });

    if (!existingLink) {
      return Response.json(
        { error: "Game not found in collection." },
        { status: 404 },
      );
    }

    await prisma.collectionGame.delete({
      where: {
        collectionId_gameId: {
          collectionId,
          gameId,
        },
      },
    });

    return Response.json({ collectionId, gameId });
  } catch (error) {
    if (error instanceof AuthError) {
      return toAuthResponse(error);
    }
    return toServerError(error);
  }
}
