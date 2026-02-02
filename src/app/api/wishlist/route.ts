import { AuthError, resolveAuthenticatedUser } from "@/lib/auth/resolve-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type WishlistPayload = {
  gameId?: number;
  igdbId?: number;
};

const parseNumericId = (raw: number | undefined) => {
  if (!raw || !Number.isFinite(raw)) return null;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return parsed;
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

export async function GET(request: Request) {
  try {
    const user = await resolveAuthenticatedUser(request);
    const entries = await prisma.wishlist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        game: {
          select: {
            id: true,
            igdbId: true,
            title: true,
            coverUrl: true,
            releaseYear: true,
            platforms: {
              select: {
                platform: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    const games = entries.map(({ createdAt, game }) => ({
      id: game.id,
      igdbId: game.igdbId,
      title: game.title,
      coverUrl: game.coverUrl,
      releaseYear: game.releaseYear,
      addedAt: createdAt,
      platforms: game.platforms.map((entry) => entry.platform.name),
    }));

    return Response.json({
      id: 0,
      name: "Wishlist",
      slug: "wishlist",
      description: null,
      createdAt: new Date().toISOString(),
      games,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return toAuthResponse(error);
    }
    return toServerError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await resolveAuthenticatedUser(request);
    let payload: WishlistPayload;

    try {
      payload = (await request.json()) as WishlistPayload;
    } catch {
      return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const rawId = parseNumericId(payload.gameId) ?? parseNumericId(payload.igdbId);
    if (!rawId) {
      return Response.json({ error: "Invalid game id." }, { status: 400 });
    }

    const game = await prisma.game.findFirst({
      where: {
        OR: [{ id: rawId }, { igdbId: rawId }],
      },
      select: {
        id: true,
        igdbId: true,
        title: true,
        coverUrl: true,
        releaseYear: true,
      },
    });

    if (!game) {
      return Response.json({ error: "Game not found." }, { status: 404 });
    }

    const existing = await prisma.wishlist.findUnique({
      where: { userId_gameId: { userId: user.id, gameId: game.id } },
      select: { createdAt: true },
    });

    if (existing) {
      return Response.json({
        alreadyExists: true,
        addedAt: existing.createdAt,
      });
    }

    const created = await prisma.wishlist.create({
      data: { userId: user.id, gameId: game.id },
      select: { createdAt: true },
    });

    return Response.json(
      {
        game: {
          id: game.id,
          igdbId: game.igdbId,
          title: game.title,
          coverUrl: game.coverUrl,
          releaseYear: game.releaseYear,
        },
        addedAt: created.createdAt,
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

export async function DELETE(request: Request) {
  try {
    const user = await resolveAuthenticatedUser(request);
    let payload: WishlistPayload;

    try {
      payload = (await request.json()) as WishlistPayload;
    } catch {
      return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const rawId = parseNumericId(payload.gameId) ?? parseNumericId(payload.igdbId);
    if (!rawId) {
      return Response.json({ error: "Invalid game id." }, { status: 400 });
    }

    const game = await prisma.game.findFirst({
      where: {
        OR: [{ id: rawId }, { igdbId: rawId }],
      },
      select: { id: true },
    });

    if (!game) {
      return Response.json({ error: "Game not found." }, { status: 404 });
    }

    const removed = await prisma.wishlist.deleteMany({
      where: { userId: user.id, gameId: game.id },
    });

    return Response.json({ removed: removed.count > 0 });
  } catch (error) {
    if (error instanceof AuthError) {
      return toAuthResponse(error);
    }
    return toServerError(error);
  }
}
