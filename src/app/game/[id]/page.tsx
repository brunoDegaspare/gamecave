/*
A client component for an individual game’s detail view, presenting hero imagery, collection status buttons, metadata (platform, release year, developer/publisher), and a screenshot grid inside the shared shell layout.
*/

"use client";

import Image from "next/image";
import Icon from "@/components/ui/icon";
import MainLayout from "@/components/layout/shell";
import PrimaryButton from "@/components/ui/primary-button";
import SecondaryButton from "@/components/ui/secondary-button";

export default function GamePage() {
  const game = {
    id: 1,
    title: "Sonic the Hedgehog 2",
    developer: "Sega Technical Institute, Sonic Team",
    publisher: "Sega, TecToy",
    release_year: "1992",
    platform: "Sega Mega Drive/Genesis",
    players: "2",
    rating: "E",
    overview:
      "Dr. Eggman (aka Dr. Robotnik) has returned, turning helpless animals into robots and forcing them to build his ultimate weapon, the Death Egg! But this time, Sonic has a friend that can help him: Tails! Find the 7 Chaos Emeralds and stop Dr. Robotnik’s evil scheme!",
    boxart: "/covers/sonic-2-md.jpg",
    background: "/placeholders/sonic2-bg.jpg",
    images: [
      "/placeholders/sonic2-1.webp",
      "/placeholders/sonic2-2.webp",
      "/placeholders/sonic2-3.webp",
      "/placeholders/sonic2-4.webp",
    ],
  };

  return (
    <MainLayout>
      <div className="w-full min-h-screen bg-neutral-950 text-neutral-100 overflow-y-auto gc-scrollbar">
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden">
          {game.background && (
            <div className="absolute inset-0">
              <Image
                src={game.background}
                alt=""
                fill
                className="object-cover opacity-15 blur-sm"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
            </div>
          )}

          <div className="relative z-10 flex flex-col items-center gap-6 pt-20 px-6 max-w-6xl mx-auto text-center">
            {/* ===== COVER ===== */}
            <div className="relative">
              <Image
                src={game.boxart}
                alt={game.title}
                width={220}
                height={280}
                className="rounded-xl shadow-xl object-cover"
              />
            </div>

            {/* ===== INFO ===== */}
            <div className="w-full flex flex-col items-center">
              <h1 className="heading-2 text-3xl font-semibold">{game.title}</h1>
              <div className="actions flex items-center justify-center gap-4 py-8">
                <PrimaryButton size="lg" leftIcon="ico-add-outline">
                  Add to collection
                </PrimaryButton>
                <SecondaryButton size="lg" leftIcon="ico-heart-outline">
                  Wishlist
                </SecondaryButton>
              </div>
              <p className="body-16 text-neutral-300 leading-relaxed">
                {game.overview}
              </p>

              {/* ===== STATS SECTION ===== */}
              <section className="grid w-full grid-cols-2 md:grid-cols-4 text-center divide-x divide-neutral-800/40 border border-neutral-800/40 rounded-xl bg-neutral-900/25 backdrop-blur-sm mt-10">
                <div className="flex flex-col py-3 px-3">
                  <span className="body-16 text-slate-500">Platform</span>
                  <span className="body-18 font-medium text-neutral-100 mt-1">
                    {game.platform}
                  </span>
                </div>

                <div className="flex flex-col py-3 px-3">
                  <span className="body-14 text-slate-500">Release Year</span>
                  <span className="body-18 font-medium text-neutral-100 mt-1">
                    {game.release_year}
                  </span>
                </div>

                <div className="flex flex-col py-3 px-3">
                  <span className="body-14 text-slate-500">Developer(s)</span>
                  <span className="body-18 font-medium text-neutral-100 mt-1">
                    {game.developer}
                  </span>
                </div>

                <div className="flex flex-col py-3 px-3">
                  <span className="body-14 text-slate-500">Publisher(s)</span>
                  <span className="body-18 font-medium text-neutral-100 mt-1">
                    {game.publisher}
                  </span>
                </div>
              </section>
            </div>
          </div>
        </section>

        {/* ===== MEDIA GALLERY ===== */}
        <section className="px-6 pb-10 max-w-7xl mx-auto mt-10">
          <h2 className="heading-5 mb-4">Screenshots</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {game.images.map((img, index) => (
              <div
                key={index}
                className="relative w-full aspect-video rounded-lg overflow-hidden"
              >
                <Image
                  src={img}
                  alt={`Screenshot ${index + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500 opacity-0 animate-fadeIn"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
