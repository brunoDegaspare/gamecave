import { prisma } from "@/lib/prisma";
import { AuthError, resolveAuthenticatedUser } from "@/lib/auth/resolve-user";

export const runtime = "nodejs";

type CollectionPayload = {
  name?: string;
  description?: string;
};

const slugify = (value: string) => {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "collection";
};

const buildUniqueSlug = async (userId: number, name: string) => {
  const baseSlug = slugify(name);
  const existing = await prisma.collection.findMany({
    where: {
      userId,
      slug: { startsWith: baseSlug },
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
    { status: 500 }
  );
};

export async function GET(request: Request) {
  try {
    const user = await resolveAuthenticatedUser(request);
    const collections = await prisma.collection.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
      },
    });

    return Response.json(collections);
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

    const slug = await buildUniqueSlug(user.id, name);

    const collection = await prisma.collection.create({
      data: {
        name,
        slug,
        description,
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
      },
    });

    return Response.json(collection, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return toAuthResponse(error);
    }
    return toServerError(error);
  }
}
