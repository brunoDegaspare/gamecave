/*
A client component for an individual game’s detail view, presenting hero imagery, collection status buttons, metadata (platform, release year, developer/publisher), and a screenshot grid inside the shared shell layout.
*/

"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import MainLayout from "@/components/layout/shell";
import PrimaryButton from "@/components/ui/primary-button";
import GhostButton from "@/components/ui/ghost-button";

export default function GamePage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [pendingCollections, setPendingCollections] = useState<string[]>([]);
  const [showCollectionsScrollbar, setShowCollectionsScrollbar] =
    useState(false);
  const collectionsScrollTimeout = useRef<number | null>(null);
  const collectionsScrollRef = useRef<HTMLDivElement | null>(null);
  const isDraggingCollections = useRef(false);
  const hasDraggedCollections = useRef(false);
  const dragStartY = useRef(0);
  const dragStartScrollTop = useRef(0);
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
    if (isPopoverOpen) {
      setPendingCollections(selectedCollections);
    }
  }, [isPopoverOpen, selectedCollections]);

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

  const handleCollectionsPointerDown = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    const target = collectionsScrollRef.current;
    if (!target) {
      return;
    }
    isDraggingCollections.current = true;
    hasDraggedCollections.current = false;
    dragStartY.current = event.clientY;
    dragStartScrollTop.current = target.scrollTop;
    target.classList.add("cursor-grabbing");
  };

  const handleCollectionsPointerMove = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!isDraggingCollections.current) {
      return;
    }
    const target = collectionsScrollRef.current;
    if (!target) {
      return;
    }
    const delta = event.clientY - dragStartY.current;
    if (Math.abs(delta) > 5) {
      hasDraggedCollections.current = true;
    }
    target.scrollTop = dragStartScrollTop.current - delta;
  };

  const handleCollectionsPointerUp = () => {
    const target = collectionsScrollRef.current;
    if (target) {
      target.classList.remove("cursor-grabbing");
    }
    isDraggingCollections.current = false;
  };

  const handleCollectionToggle = (collection: string) => {
    setPendingCollections((prev) =>
      prev.includes(collection)
        ? prev.filter((item) => item !== collection)
        : [...prev, collection]
    );
  };

  const handleApplyCollections = () => {
    setSelectedCollections(pendingCollections);
    setIsPopoverOpen(false);
  };
  
  const handlePopoverBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return;
    }
    setIsPopoverOpen(false);
  };

  return (
    <MainLayout>
      <div className="drawer drawer-end">
        <input
          id="add-to-collection-drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={isDrawerOpen}
          onChange={(event) => setIsDrawerOpen(event.target.checked)}
        />
        <div className="drawer-content w-full min-h-screen bg-neutral-950 text-neutral-100 overflow-y-auto gc-scrollbar">
          {/* ===== HERO ===== */}
          <section className="relative">
            {game.background && (
              <div className="absolute inset-0 overflow-hidden">
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
                  width={280}
                  height={340}
                  className="w-[220px] h-auto rounded-xl shadow-xl object-cover md:w-[280px]"
                />
              </div>

              {/* ===== INFO ===== */}
              <div className="w-full flex flex-col items-center">
                <h1 className="heading-2 text-3xl font-semibold">
                  {game.title}
                </h1>
                <div className="actions flex items-center justify-center gap-4 py-8">
                  <div
                    className={`dropdown dropdown-end ${
                      isPopoverOpen ? "dropdown-open" : ""
                    }`}
                    tabIndex={0}
                    onBlur={handlePopoverBlur}
                  >
                    <PrimaryButton
                      size="lg"
                      leftIcon="ico-add-outline"
                      onClick={() => setIsPopoverOpen((prev) => !prev)}
                    >
                      Add to collection
                    </PrimaryButton>
                    {isPopoverOpen && (
                      <div
                        className="dropdown-content z-50 mt-3 w-80 rounded-2xl border border-neutral-800 bg-neutral-950/95 shadow-xl backdrop-blur"
                        tabIndex={0}
                      >
                        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-neutral-800 bg-neutral-950/95 px-4 py-3">
                          <span className="body-16 text-neutral-100">
                            Add to
                          </span>
                          <GhostButton size="md" onClick={handleApplyCollections}>
                            Done
                          </GhostButton>
                        </div>
                        <div className="p-4">
                          <GhostButton
                            size="md"
                            leftIcon="ico-add-outline"
                            className="w-full justify-start bg-neutral-900/60 hover:bg-neutral-900"
                          >
                            Create collection
                          </GhostButton>
                        </div>
                        <div className="px-4 pb-4 space-y-3 max-h-64 overflow-y-auto pr-1 gc-scrollbar">
                          {sortedCollections.map((collection) => (
                            <label
                              key={collection}
                              className="relative flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/30 px-4 py-3 cursor-pointer transition-all duration-300 ease-out hover:bg-neutral-900"
                            >
                              <input
                                type="checkbox"
                                checked={pendingCollections.includes(
                                  collection
                                )}
                                onChange={() =>
                                  handleCollectionToggle(collection)
                                }
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
                    )}
                  </div>
                  <GhostButton size="lg" iconOnly="ico-heart-outline">
                    Wishlist
                  </GhostButton>
                </div>
                <p className="body-18 text-neutral-300 leading-relaxed">
                  {game.overview}
                </p>

                {/* ===== STATS SECTION ===== */}
                <section className="grid w-full grid-cols-2 md:grid-cols-4 text-center divide-x divide-neutral-800/40 border border-neutral-800/40 rounded-xl bg-neutral-900/25 backdrop-blur-sm mt-10">
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
          <aside className="w-80 md:w-[465px] h-screen bg-neutral-950 text-neutral-100 border-l border-neutral-800 flex flex-col">
            <div className="sticky top-0 z-10 bg-neutral-950 border-b border-neutral-900 px-6 py-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="heading-4 text-white">Add to collection</h3>
                <GhostButton
                  size="md"
                  iconOnly="ico-cross-outline"
                  aria-label="Close drawer"
                  onClick={() => setIsDrawerOpen(false)}
                />
              </div>
            </div>

            <div className="flex-1 p-6 pb-24 overflow-y-auto gc-scrollbar">
              <div className="space-y-6">
                <div className="space-y-3 px-4 py-4 rounded-xl bg-neutral-900/50">
                  <p className="body-14 weight-medium text-neutral-300">
                    Collections
                  </p>
                  <div
                    ref={collectionsScrollRef}
                    className={`space-y-3 max-h-78 overflow-y-auto pr-1 gc-scrollbar scrollbar-thin scrollbar-track-transparent cursor-grab select-none ${
                      showCollectionsScrollbar
                        ? "scrollbar-thumb-neutral-700/70"
                        : "scrollbar-thumb-transparent"
                    }`}
                    onScroll={handleCollectionsScroll}
                    onMouseDown={handleCollectionsPointerDown}
                    onMouseMove={handleCollectionsPointerMove}
                    onMouseUp={handleCollectionsPointerUp}
                    onMouseLeave={handleCollectionsPointerUp}
                    onClickCapture={(event) => {
                      if (hasDraggedCollections.current) {
                        event.preventDefault();
                        event.stopPropagation();
                        hasDraggedCollections.current = false;
                      }
                    }}
                  >
                    {sortedCollections.map((collection) => (
                      <label
                        key={collection}
                        className="relative flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/30 px-4 py-4 cursor-pointer transition-all duration-300 ease-out hover:bg-neutral-900"
                      >
                        <input
                          type="checkbox"
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

                <div className="space-y-3 px-4 py-4 rounded-xl bg-neutral-900/50">
                  <p className="body-14 weight-medium text-slate-400">
                    Contents
                  </p>
                  <div className="space-y-3">
                    {["Cartridge", "Box", "Manual"].map((item) => (
                      <label
                        key={item}
                        className="relative flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/30 px-4 py-4 cursor-pointer transition-all duration-300 ease-out hover:bg-neutral-900"
                      >
                        <input
                          type="checkbox"
                          className="checkbox peer border-neutral-600 bg-neutral-900/80 hover:bg-neutral-900 checked:border-transparent checked:bg-purple-600 checked:hover:bg-purple-600 focus:ring-0 [--chkfg:#ffffff] cursor-pointer transition-colors duration-300 ease-out"
                        />
                        <span className="body-16 text-neutral-100">{item}</span>
                        <span className="pointer-events-none absolute inset-0 rounded-xl transition-all duration-300 ease-out peer-checked:border peer-checked:border-purple-500 peer-checked:shadow-[0_0_0_1px_rgba(168,85,247,0.6)]" />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 px-4 py-4 rounded-xl bg-neutral-900/50">
                  <p className="body-14 weight-medium text-slate-400">
                    Play status
                  </p>
                  <div className="space-y-3">
                    {statusOptions.map((status) => (
                      <label
                        key={status.value}
                        className="relative flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/30 px-4 py-4 cursor-pointer transition-all duration-300 ease-in-out hover:bg-neutral-900"
                      >
                        <input
                          type="radio"
                          name="game-status"
                          value={status.value}
                          className="radio peer border-neutral-600 bg-neutral-900/80 text-purple-600 transition-colors duration-300 ease-in-out"
                        />
                        <span className="body-16 text-neutral-100">
                          {status.label}
                        </span>
                        <span className="pointer-events-none absolute inset-0 rounded-xl transition-all duration-300 ease-in-out peer-checked:border peer-checked:border-purple-500 peer-checked:shadow-[0_0_0_1px_rgba(168,85,247,0.6)]" />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-neutral-900 bg-neutral-950/95 px-6 py-6 backdrop-blur">
              <PrimaryButton size="md" onClick={() => setIsDrawerOpen(false)}>
                Add to collection
              </PrimaryButton>
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
