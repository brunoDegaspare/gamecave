"use client";

import HomeHighlights from "@/components/home/home-highlights";
import CollectionCarousel from "@/components/ui/collection-carousel";

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

      <CollectionCarousel
        title="Recently added to your collections"
        collections={RECENT_COLLECTIONS}
      />
    </div>
  );
}
