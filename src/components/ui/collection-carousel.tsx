"use client";

import useEmblaCarousel from "embla-carousel-react";
import CollectionCard from "@/components/ui/collection-card";

type Collection = {
  id: string;
  title: string;
  gamesCount: number;
  lastGameCover?: string;
};

export default function CollectionCarousel({
  title,
  collections,
  onCollectionClick,
}: {
  title: string;
  collections: Collection[];
  onCollectionClick?: (collection: Collection) => void;
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
      </div>

      <div
        ref={emblaRef}
        className="relative w-full max-w-full overflow-x-clip overflow-y-visible"
      >
        <div className="flex gap-3 will-change-transform">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="flex-[0_0_auto] basis-[260px] md:basis-[320px] shrink-0"
            >
              <CollectionCard
                {...collection}
                onClick={() => onCollectionClick?.(collection)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
