import { prisma } from "@/lib/prisma";
import { AuthError, resolveAuthenticatedUser } from "@/lib/auth/resolve-user";

export const runtime = "nodejs";

const parseCollectionId = (raw: string | undefined) => {
  if (!raw) return null;
  const match = raw.trim().match(/^(\d+)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const parseCollectionSlug = (raw: string | undefined) => {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  const idSlugMatch = trimmed.match(/^\d+-(.+)$/);
  if (idSlugMatch?.[1]) {
    return idSlugMatch[1];
  }
  return trimmed;
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ collectionId?: string }> },
) {
  try {
    const user = await resolveAuthenticatedUser(request);
    const { collectionId: rawCollectionId } = await params;
    const collectionId = parseCollectionId(rawCollectionId);
    const collectionSlug = parseCollectionSlug(rawCollectionId);
    if (!collectionId && !collectionSlug) {
      return Response.json({ error: "Invalid collection id." }, { status: 400 });
    }

    const orConditions: Array<{ id?: number; slug?: string }> = [];
    if (collectionId) {
      orConditions.push({ id: collectionId });
    }
    if (collectionSlug) {
      orConditions.push({ slug: collectionSlug });
    }

    const collection = await prisma.collection.findFirst({
      where: {
        userId: user.id,
        OR: orConditions,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        games: {
          orderBy: { addedAt: "desc" },
          select: {
            addedAt: true,
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
        },
      },
    });

    if (!collection) {
      return Response.json({ error: "Collection not found." }, { status: 404 });
    }

    const games = collection.games.map(({ addedAt, game }) => ({
      id: game.id,
      igdbId: game.igdbId,
      title: game.title,
      coverUrl: game.coverUrl,
      releaseYear: game.releaseYear,
      addedAt,
      platforms: game.platforms.map((entry) => entry.platform.name),
    }));

    return Response.json({
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      createdAt: collection.createdAt,
      games,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return toAuthResponse(error);
    }
    return toServerError(error);
  }
}
