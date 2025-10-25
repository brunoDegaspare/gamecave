"use client";
import useEmblaCarousel from "embla-carousel-react";
import GameCard from "@/components/ui/game-card";

export default function GameCarousel({
  title,
  games,
}: {
  title: string;
  games: { cover: string; name: string; platform: string }[];
}) {
  const [emblaRef] = useEmblaCarousel({
    loop: false,
    align: "start",
    dragFree: true,
    containScroll: "keepSnaps",
  });

  return (
    <section className="w-full max-w-full overflow-x-clip overflow-y-visible">
      <div className="mb-4 flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold text-neutral-100">{title}</h2>
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
