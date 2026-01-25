import { AuthError, resolveAuthenticatedUser } from "@/lib/auth/resolve-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const parseGameId = (raw: string | undefined) => {
  if (!raw) return null;
  if (!/^\d+$/.test(raw)) return null;
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId?: string }> },
) {
  try {
    const user = await resolveAuthenticatedUser(request);
    const { gameId: rawGameId } = await params;
    const gameId = parseGameId(rawGameId);
    if (!gameId) {
      return Response.json({ error: "Invalid game id." }, { status: 400 });
    }

    const game = await prisma.game.findFirst({
      where: {
        OR: [{ id: gameId }, { igdbId: gameId }],
      },
      select: { id: true },
    });

    if (!game) {
      return Response.json({ collectionIds: [] });
    }

    const entries = await prisma.collectionGame.findMany({
      where: { gameId: game.id, collection: { userId: user.id } },
      select: { collectionId: true },
    });

    return Response.json({
      collectionIds: entries.map((entry) => entry.collectionId),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return toAuthResponse(error);
    }
    return toServerError(error);
  }
}
