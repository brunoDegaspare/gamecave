"use client";

import HomeHighlights from "@/components/home/home-highlights";
import CollectionCard from "@/components/ui/collection-card";

const RECENT_COLLECTIONS = [
  {
    id: "snes",
    title: "SNES Classics",
    gamesCount: 18,
    lastGameCover: "/covers/super-metroid.jpg",
  },
  {
    id: "md",
    title: "Mega Drive",
    gamesCount: 12,
    lastGameCover: "/covers/sonic-2-md.jpg",
  },
  {
    id: "ms",
    title: "Master System",
    gamesCount: 9,
    lastGameCover: "/covers/alex-kidd.jpg",
  },
  {
    id: "psx",
    title: "PlayStation",
    gamesCount: 15,
    lastGameCover: "/covers/mega-man-x.jpg",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <HomeHighlights />

      <section className="w-full max-w-full overflow-hidden">
        <div className="mb-4 flex items-center justify-between px-1">
          <h2 className="heading-5 text-neutral-100">
            Your collections
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RECENT_COLLECTIONS.map((collection) => (
            <CollectionCard key={collection.id} {...collection} />
          ))}
        </div>
      </section>
    </div>
  );
}
