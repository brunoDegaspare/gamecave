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

const slugify = (value: string) => {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "collection";
};

const buildUniqueSlug = async (userId: number, name: string, excludeId?: number) => {
  const baseSlug = slugify(name);
  const existing = await prisma.collection.findMany({
    where: {
      userId,
      slug: { startsWith: baseSlug },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { slug: true },
  });

  if (existing.length === 0) {
    return baseSlug;
  }

  let maxSuffix = 0;
  for (const entry of existing) {
    const slug = entry.slug;
    if (slug === baseSlug) {
      maxSuffix = Math.max(maxSuffix, 1);
      continue;
    }
    if (!slug.startsWith(`${baseSlug}-`)) {
      continue;
    }
    const suffix = Number(slug.slice(baseSlug.length + 1));
    if (Number.isSafeInteger(suffix) && suffix > 1) {
      maxSuffix = Math.max(maxSuffix, suffix);
    }
  }

  return maxSuffix <= 1 ? `${baseSlug}-2` : `${baseSlug}-${maxSuffix + 1}`;
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

type CollectionPayload = {
  name?: string;
  description?: string;
};

export async function PATCH(
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

    const existing = await prisma.collection.findFirst({
      where: {
        userId: user.id,
        OR: orConditions,
      },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        createdAt: true,
      },
    });

    if (!existing) {
      return Response.json({ error: "Collection not found." }, { status: 404 });
    }

    let payload: CollectionPayload;
    try {
      payload = (await request.json()) as CollectionPayload;
    } catch {
      return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    if (!name) {
      return Response.json({ error: "Name is required." }, { status: 400 });
    }

    const description =
      typeof payload.description === "string"
        ? payload.description.trim() || null
        : null;

    const shouldUpdateSlug = name !== existing.name;
    const slug = shouldUpdateSlug
      ? await buildUniqueSlug(user.id, name, existing.id)
      : existing.slug;

    const updated = await prisma.collection.update({
      where: { id: existing.id },
      data: {
        name,
        description,
        slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
      },
    });

    return Response.json(updated);
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

    const existing = await prisma.collection.findFirst({
      where: {
        userId: user.id,
        OR: orConditions,
      },
      select: { id: true },
    });

    if (!existing) {
      return Response.json({ error: "Collection not found." }, { status: 404 });
    }

    await prisma.collection.delete({
      where: { id: existing.id },
    });

    return Response.json({ id: existing.id });
  } catch (error) {
    if (error instanceof AuthError) {
      return toAuthResponse(error);
    }
    return toServerError(error);
  }
}
