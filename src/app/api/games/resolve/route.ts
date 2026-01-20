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

const IGDB_API_URL = "https://api.igdb.com/v4/games";

const parseIgdbId = (raw: string | null) => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
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
      `IGDB request failed with status ${response.status} ${response.statusText}`
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

  return dbGame;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const igdbId = parseIgdbId(searchParams.get("igdbId"));
  if (!igdbId) {
    return Response.json(
      { ok: false, error: "Invalid igdbId" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.game.findUnique({
      where: { igdbId },
      select: { id: true },
    });
    if (existing) {
      return Response.json({ ok: true, id: existing.id });
    }
  } catch (error) {
    console.error("resolve-game: db lookup failed", { igdbId, error });
    return Response.json(
      { ok: false, error: "Database lookup failed" },
      { status: 500 }
    );
  }

  let igdbGame: IgdbGame | null = null;
  try {
    igdbGame = await fetchIgdbGameById(igdbId);
  } catch (error) {
    console.error("resolve-game: IGDB request failed", { igdbId, error });
    return Response.json(
      { ok: false, error: "IGDB request failed" },
      { status: 500 }
    );
  }

  if (!igdbGame) {
    return Response.json(
      { ok: false, error: "IGDB game not found" },
      { status: 404 }
    );
  }

  try {
    const dbGame = await persistIgdbGame(igdbGame);
    if (!dbGame) {
      return Response.json(
        { ok: false, error: "Failed to persist game" },
        { status: 500 }
      );
    }

    return Response.json({ ok: true, id: dbGame.id });
  } catch (error) {
    console.error("resolve-game: persist failed", { igdbId, error });
    return Response.json(
      { ok: false, error: "Failed to persist game" },
      { status: 500 }
    );
  }
}
