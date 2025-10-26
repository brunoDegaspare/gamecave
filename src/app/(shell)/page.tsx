import Link from "next/link";
import HomeHighlights from "@/components/home/home-highlights";
import GameCarousel from "@/components/ui/game-carousel";

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
      name: "Alex Kidd in Miracle World and a very long name",
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
    {
      cover: "/covers/mega-man-x.jpg",
      name: "Another game A",
      platform: "SNES",
    },
    {
      cover: "/covers/mega-man-x.jpg",
      name: "Another game B",
      platform: "SNES",
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      <HomeHighlights />
      <GameCarousel title="Recently added" games={recentGames} />
    </div>
  );
}
