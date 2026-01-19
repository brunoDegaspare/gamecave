import GameDetailsClient from "./game-details-client";
import { getGameById } from "@/lib/db/games";

type GamePageProps = {
  params: Promise<{ id: string }>;
};

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params;
  const igdbId = Number(id);
  const game = await getGameById(igdbId);

  return <GameDetailsClient game={game} />;
}
