import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const gameCount = await prisma.game.count();
    return Response.json({ ok: true, gameCount });
  } catch (error) {
    const details =
      error instanceof Error ? error.message : "Unknown database error";
    return Response.json(
      { ok: false, error: "Database connection failed", details },
      { status: 500 },
    );
  }
}
