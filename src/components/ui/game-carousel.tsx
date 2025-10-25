"use client";

import useEmblaCarousel from "embla-carousel-react";
import GameCard from "@/components/ui/game-card";

type Game = {
  cover: string;
  name: string;
  platform: string;
};

type GameCarouselProps = {
  title: string;
  games: Game[];
  viewAllLink?: string;
};

export default function GameCarousel({
  title,
  games,
  viewAllLink,
}: GameCarouselProps) {
  const [emblaRef] = useEmblaCarousel({ loop: false, align: "start" });

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold text-neutral-100">{title}</h2>
        {viewAllLink && (
          <a
            href={viewAllLink}
            className="text-sm text-neutral-400 hover:text-neutral-200 transition"
          >
            View all
          </a>
        )}
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-5">
          {games.map((game) => (
            <div
              key={`${game.name}-${game.platform}`}
              className="flex-[0_0_auto]"
            >
              <GameCard
                cover={game.cover}
                name={game.name}
                platform={game.platform}
                className="w-[200px]"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
