"use client";

/*
Defines the dashboard/home route; it wires stat highlight cards and several horizontal carousels of recent or platform-specific games, seeded with mock data and making heavy use of the UI component library.
*/

import { useState } from "react";
import HomeHighlights from "@/components/home/home-highlights";
import GameCarousel from "@/components/ui/game-carousel";
import GameCompletionModal from "@/components/ui/game-completion-modal";

type CompletionState = {
  cartridge: boolean;
  manual: boolean;
  box: boolean;
};

type Game = {
  id: number;
  cover: string;
  name: string;
  platform: string;
  completion: CompletionState;
};

const INITIAL_RECENT_GAMES: Game[] = [
  {
    id: 1,
    cover: "/covers/super-metroid.jpg",
    name: "Super Metroid",
    platform: "SNES",
    completion: { cartridge: true, manual: true, box: false },
  },
  {
    id: 2,
    cover: "/covers/sonic-2-md.jpg",
    name: "Sonic the Hedgehog 2",
    platform: "Mega Drive",
    completion: { cartridge: true, manual: false, box: true },
  },
  {
    id: 3,
    cover: "/covers/street-fighter-ii.jpg",
    name: "Street Fighter II",
    platform: "SNES",
    completion: { cartridge: true, manual: false, box: false },
  },
  {
    id: 4,
    cover: "/covers/phantasy-star-iv.jpg",
    name: "Phantasy Star IV",
    platform: "Mega Drive",
    completion: { cartridge: false, manual: false, box: false },
  },
  {
    id: 5,
    cover: "/covers/alex-kidd.jpg",
    name: "Alex Kidd in Miracle World and a very long name",
    platform: "Master System",
    completion: { cartridge: true, manual: true, box: true },
  },
  {
    id: 6,
    cover: "/covers/f-zero.jpg",
    name: "F-Zero",
    platform: "SNES",
    completion: { cartridge: false, manual: false, box: true },
  },
  {
    id: 7,
    cover: "/covers/gunstar-heroes.jpg",
    name: "Gunstar Heroes",
    platform: "Mega Drive",
    completion: { cartridge: true, manual: false, box: true },
  },
  {
    id: 8,
    cover: "/covers/castlevania-iv.jpg",
    name: "Super Castlevania IV",
    platform: "SNES",
    completion: { cartridge: true, manual: true, box: false },
  },
  {
    id: 9,
    cover: "/covers/streets-of-rage-2.jpg",
    name: "Streets of Rage 2",
    platform: "Mega Drive",
    completion: { cartridge: false, manual: true, box: true },
  },
  {
    id: 10,
    cover: "/covers/mega-man-x.jpg",
    name: "Mega Man X",
    platform: "SNES",
    completion: { cartridge: true, manual: false, box: false },
  },
  {
    id: 11,
    cover: "/covers/mega-man-x.jpg",
    name: "Another game A",
    platform: "SNES",
    completion: { cartridge: false, manual: true, box: false },
  },
  {
    id: 12,
    cover: "/covers/mega-man-x.jpg",
    name: "Another game B",
    platform: "SNES",
    completion: { cartridge: false, manual: false, box: true },
  },
];

export default function HomePage() {
  const [recentGames, setRecentGames] = useState<Game[]>(INITIAL_RECENT_GAMES);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const handleGameClick = (gameCard: {
    name: string;
    platform: string;
  }) => {
    const matchedGame = recentGames.find(
      (game) =>
        game.name === gameCard.name && game.platform === gameCard.platform
    );

    if (matchedGame) {
      setSelectedGame(matchedGame);
    }
  };

  const handleSaveCompletion = (completion: CompletionState) => {
    if (!selectedGame) return;

    setRecentGames((prev) =>
      prev.map((game) =>
        game.name === selectedGame.name ? { ...game, completion } : game
      )
    );
    setSelectedGame(null);
  };

  return (
    <>
      <div className="flex flex-col gap-10 p-6">
        <HomeHighlights />
        <GameCarousel
          title="Recently added to your collections"
          games={recentGames}
          onGameClick={handleGameClick}
        />
        <GameCarousel
          title="SNES"
          viewAllLink="/collections"
          games={recentGames}
          onGameClick={handleGameClick}
        />
        <GameCarousel
          title="Mega Drive"
          viewAllLink="/collections"
          games={recentGames}
          onGameClick={handleGameClick}
        />
        <GameCarousel
          title="Master System"
          viewAllLink="/collections"
          games={recentGames}
          onGameClick={handleGameClick}
        />
      </div>

      <GameCompletionModal
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
        onSave={handleSaveCompletion}
      />
    </>
  );
}
