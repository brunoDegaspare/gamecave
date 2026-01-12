/*
A client component for an individual game’s detail view, presenting hero imagery, collection status buttons, metadata (platform, release year, developer/publisher), and a screenshot grid inside the shared shell layout.
*/

"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import MainLayout from "@/components/layout/shell";
import PrimaryButton from "@/components/ui/primary-button";
import GhostButton from "@/components/ui/ghost-button";
import InvertedButton from "@/components/ui/inverted-button";
import Alert from "@/components/ui/alert";

export default function GamePage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [pendingCollections, setPendingCollections] = useState<string[]>([]);
  const [showCollectionError, setShowCollectionError] = useState(false);
  const [showCollectionsScrollbar, setShowCollectionsScrollbar] =
    useState(false);
  const collectionsScrollTimeout = useRef<number | null>(null);
  const collectionsScrollRef = useRef<HTMLDivElement | null>(null);
  const userCollections = [
    "Mega Drive",
    "SNES",
    "PC Engine",
    "PlayStation",
    "Dreamcast",
    "Nintendo 64",
    "Game Boy",
  ];
  const sortedCollections = [...userCollections].sort((a, b) =>
    a.localeCompare(b)
  );
  const statusOptions = [
    {
      value: "not-played",
      label: "Not played",
    },
    {
      value: "played-not-finished",
      label: "Played but not finished",
    },
    {
      value: "playing",
      label: "Currently playing",
    },
    {
      value: "finished",
      label: "Finished",
    },
  ] as const;
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

  useEffect(() => {
    if (isDrawerOpen) {
      setPendingCollections(selectedCollections);
      setShowCollectionError(false);
    }
  }, [isDrawerOpen, selectedCollections]);

  useEffect(() => {
    if (pendingCollections.length > 0 && showCollectionError) {
      setShowCollectionError(false);
    }
  }, [pendingCollections, showCollectionError]);

  useEffect(() => {
    return () => {
      if (collectionsScrollTimeout.current !== null) {
        window.clearTimeout(collectionsScrollTimeout.current);
      }
    };
  }, []);

  const handleCollectionsScroll = () => {
    setShowCollectionsScrollbar(true);
    if (collectionsScrollTimeout.current !== null) {
      window.clearTimeout(collectionsScrollTimeout.current);
    }
    collectionsScrollTimeout.current = window.setTimeout(() => {
      setShowCollectionsScrollbar(false);
    }, 800);
  };

  const handleCollectionToggle = (collection: string) => {
    setPendingCollections((prev) =>
      prev.includes(collection)
        ? prev.filter((item) => item !== collection)
        : [...prev, collection]
    );
  };

  const handleApplyCollections = () => {
    if (pendingCollections.length === 0) {
      setShowCollectionError(true);
      return;
    }
    setIsDrawerOpen(false);
    setSelectedCollections(pendingCollections);
  };

  return (
    <MainLayout>
      <div className="drawer drawer-end h-full min-h-0">
        <input
          id="add-to-collection-drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={isDrawerOpen}
          onChange={(event) => setIsDrawerOpen(event.target.checked)}
        />
        <div className="drawer-content w-full h-full min-h-0 bg-neutral-950 text-neutral-100">
          {/* ===== HERO ===== */}
          <section className="relative isolate">
            {game.background && (
              <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-15"
                  style={{ backgroundImage: `url(${game.background})` }}
                />
                <div className="absolute inset-0 bg-neutral-950/20 backdrop-blur-sm" />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
              </div>
            )}

            <div className="relative z-10 flex flex-col items-center gap-6 pt-14 px-6 max-w-6xl mx-auto text-center lg:gap-4 xl:gap-5 2xl:gap-6 lg:pt-14 xl:pt-16 2xl:pt-20">
              {/* ===== COVER ===== */}
              <div className="relative">
                {/* Compact desktops get a smaller cover so title/CTA/metadata land above the fold. */}
                <Image
                  src={game.boxart}
                  alt={game.title}
                  width={280}
                  height={340}
                  className="w-[220px] h-auto rounded-xl shadow-xl object-cover md:w-[280px] lg:w-[190px] lg:max-h-[270px] xl:w-[230px] xl:max-h-[330px] 2xl:w-[280px] 2xl:max-h-[420px]"
                />
              </div>

              {/* ===== INFO ===== */}
              <div className="w-full flex flex-col items-center">
                <h1 className="heading-3 2xl:heading-2 lg:heading-3 xl:heading-4">
                  {game.title}
                </h1>
                {/* Tighter hero spacing boosts above-the-fold visibility on smaller desktops. */}
                <div className="actions flex items-center justify-center gap-4 py-8 lg:gap-3 lg:py-4 xl:py-5 2xl:py-8">
                  {selectedCollections.length > 0 ? (
                    <InvertedButton
                      size="md"
                      leftIcon="ico-tick-outline"
                      onClick={() => setIsDrawerOpen(true)}
                    >
                      Added (in {selectedCollections.length}{" "}
                      {selectedCollections.length === 1
                        ? "collection"
                        : "collections"}
                      )
                    </InvertedButton>
                  ) : (
                    <PrimaryButton
                      size="md"
                      leftIcon="ico-add-outline"
                      onClick={() => setIsDrawerOpen(true)}
                    >
                      Add to collection
                    </PrimaryButton>
                  )}
                  <GhostButton size="md" iconOnly="ico-heart-outline">
                    Wishlist
                  </GhostButton>
                </div>
                <p className="body-18 text-neutral-300 leading-relaxed">
                  {game.overview}
                </p>

                {/* ===== STATS SECTION ===== */}
                <section className="grid w-full grid-cols-2 md:grid-cols-4 text-center divide-x divide-neutral-800/40 border border-neutral-800/40 rounded-xl bg-neutral-900/25 backdrop-blur-sm mt-10 lg:mt-6 xl:mt-8 2xl:mt-10">
                  <div className="flex flex-col py-3 px-3">
                    <span className="body-14 text-slate-500">Platform</span>
                    <span className="body-16 font-medium text-neutral-100 mt-1">
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
                    <span className="body-16 font-medium text-neutral-100 mt-1">
                      {game.developer}
                    </span>
                  </div>

                  <div className="flex flex-col py-3 px-3">
                    <span className="body-14 text-slate-500">Publisher(s)</span>
                    <span className="body-16 font-medium text-neutral-100 mt-1">
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

        <div className="drawer-side z-50">
          <div
            className="drawer-overlay"
            onClick={() => setIsDrawerOpen(false)}
          />
          <aside className="w-full md:w-[460px] h-full bg-neutral-950 text-neutral-100 border-l border-neutral-800 flex flex-col">
            <div className="sticky top-0 z-10 bg-neutral-950 border-b border-neutral-900 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="heading-4 text-white">Add to</h3>
                <GhostButton
                  size="md"
                  iconOnly="ico-cross-outline"
                  aria-label="Close drawer"
                  onClick={() => setIsDrawerOpen(false)}
                />
              </div>
            </div>

            <div className="flex-1 px-4 pt-6 pb-0 md:pb-6">
              <div className="flex h-full flex-col space-y-6">
                <GhostButton
                  size="md"
                  leftIcon="ico-add-outline"
                  className="w-full justify-start bg-neutral-900/60 hover:bg-neutral-900"
                >
                  New collection
                </GhostButton>
                <div
                  ref={collectionsScrollRef}
                  className={`flex-1 space-y-3 overflow-y-auto pr-1 gc-scrollbar scrollbar-thin scrollbar-track-transparent ${
                    showCollectionsScrollbar
                      ? "scrollbar-thumb-neutral-700/70"
                      : "scrollbar-thumb-transparent"
                  }`}
                  onScroll={handleCollectionsScroll}
                >
                  {sortedCollections.map((collection) => (
                    <label
                      key={collection}
                      className="relative flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/30 px-4 py-3 cursor-pointer transition-all duration-300 ease-out hover:bg-neutral-900"
                    >
                      <input
                        type="checkbox"
                        checked={pendingCollections.includes(collection)}
                        onChange={() => handleCollectionToggle(collection)}
                        className="checkbox peer border-neutral-600 bg-neutral-900/80 hover:bg-neutral-900 checked:border-transparent checked:bg-purple-600 checked:hover:bg-purple-600 focus:ring-0 [--chkfg:#ffffff] cursor-pointer transition-colors duration-300 ease-out"
                      />
                      <span className="body-16 text-neutral-100">
                        {collection}
                      </span>
                      <span className="pointer-events-none absolute inset-0 rounded-xl transition-all duration-300 ease-out peer-checked:border peer-checked:border-purple-500 peer-checked:shadow-[0_0_0_1px_rgba(168,85,247,0.6)]" />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-neutral-900 bg-neutral-950/95 px-4 py-6 backdrop-blur relative">
              <div
                className={`absolute inset-x-0 bottom-full mb-3 px-4 transition-all duration-200 ease-out ${
                  showCollectionError
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2 pointer-events-none"
                }`}
                aria-hidden={!showCollectionError}
              >
                <Alert icon="ico-cross-circle-bold">
                  <span>Please select at least one collection.</span>
                </Alert>
              </div>
              <PrimaryButton
                size="md"
                className="w-full"
                onClick={handleApplyCollections}
              >
                Add
                {pendingCollections.length > 0
                  ? ` (${pendingCollections.length})`
                  : ""}
              </PrimaryButton>
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
