"use client";

import useEmblaCarousel from "embla-carousel-react";
import GameCard from "@/components/ui/game-card";

export default function GameCarousel({
  title,
  games,
  viewAllLink,
}: {
  title: string;
  games: { cover: string; name: string; platform: string }[];
  viewAllLink?: string;
}) {
  const [emblaRef] = useEmblaCarousel({
    loop: false,
    align: "start",
    dragFree: true,
    containScroll: "keepSnaps",
  });

  return (
    <section className="w-full max-w-full overflow-x-clip overflow-y-visible">
      <div className="mb-3 pb-2 flex items-center justify-between px-1 border-b border-neutral-800">
        <h2 className="heading-5 text-neutral-100">{title}</h2>

        {/* 👇 View all link */}
        {viewAllLink && (
          <a
            href={viewAllLink}
            className="text-sm text-neutral-400 hover:text-neutral-200 transition relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 hover:after:w-full after:bg-neutral-400 after:transition-all"
          >
            View all
          </a>
        )}
      </div>

      {/* Viewport */}
      <div
        ref={emblaRef}
        className="relative w-full max-w-full overflow-x-clip overflow-y-visible"
      >
        {/* Track */}
        <div className="flex gap-2 will-change-transform">
          {games.map((g) => (
            <div
              key={`${g.name}-${g.platform}`}
              className="flex-[0_0_auto] basis-[148px] md:basis-[200px] shrink-0"
            >
              <GameCard {...g} className="w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
