import { prisma } from "@/lib/prisma";
import { AuthError, resolveAuthenticatedUser } from "@/lib/auth/resolve-user";

export const runtime = "nodejs";

type CollectionPayload = {
  name?: string;
  description?: string;
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

    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
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
