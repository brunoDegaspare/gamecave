import Link from "next/link";
import HomeHighlights from "@/components/home/home-highlights";
import GameCard from "@/components/ui/game-card";

export default function HomePage() {
  const recentGames = [
    {
      cover: "/covers/super-metroid.jpg",
      name: "Super Metroid",
      platform: "SNES",
    },
    {
      cover: "/covers/sonic-2-md.jpg",
      name: "Sonic the Hedgehog 2",
      platform: "Mega Drive",
    },
    {
      cover: "/covers/street-fighter-ii.jpg",
      name: "Street Fighter II",
      platform: "SNES",
    },
    {
      cover: "/covers/phantasy-star-iv.jpg",
      name: "Phantasy Star IV",
      platform: "Mega Drive",
    },
    {
      cover: "/covers/alex-kidd.jpg",
      name: "Alex Kidd in Miracle World",
      platform: "Master System",
    },
    { cover: "/covers/f-zero.jpg", name: "F-Zero", platform: "SNES" },
    {
      cover: "/covers/gunstar-heroes.jpg",
      name: "Gunstar Heroes",
      platform: "Mega Drive",
    },
    {
      cover: "/covers/castlevania-iv.jpg",
      name: "Super Castlevania IV",
      platform: "SNES",
    },
    {
      cover: "/covers/streets-of-rage-2.jpg",
      name: "Streets of Rage 2",
      platform: "Mega Drive",
    },
    { cover: "/covers/mega-man-x.jpg", name: "Mega Man X", platform: "SNES" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* === Row 1: Hero / Highlights === */}
      <HomeHighlights />

      {/* === Row 2: Recent Activity === */}
      <section>
        <div className="mb-4 flex items-center justify-between px-1">
          <h2 className="text-lg font-semibold text-neutral-100">
            Recently added to my collection
          </h2>
          <Link
            href="/collections"
            className="text-sm text-neutral-400 hover:text-neutral-200 transition"
          >
            View all
          </Link>
        </div>

        <div
          className="
            flex gap-6 overflow-x-auto pb-3
            [scrollbar-width:none] [-ms-overflow-style:none]
          "
          style={{ scrollbarWidth: "none" } as React.CSSProperties}
        >
          {recentGames.map((g) => (
            <GameCard
              key={`${g.name}-${g.platform}`}
              cover={g.cover}
              name={g.name}
              platform={g.platform}
              className="min-w-[120px] md:min-w-[140px]"
            />
          ))}
        </div>
      </section>

      {/* === Row 3: Recommendations (placeholder) === */}
      {/* Futuro: seção de recomendações/AI trends */}
    </div>
  );
}
