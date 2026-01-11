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
  const [dropdownPlacement, setDropdownPlacement] = useState<"bottom" | "top">(
    "bottom"
  );
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState<number | null>(
    null
  );
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const collectionsScrollTimeout = useRef<number | null>(null);
  const collectionsScrollRef = useRef<HTMLDivElement | null>(null);
  const dropdownTriggerRef = useRef<HTMLDivElement | null>(null);
  const dropdownContentRef = useRef<HTMLDivElement | null>(null);
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
    if (!isPopoverOpen) {
      return;
    }
    // Reset positioning state on open to avoid inheriting stale placement.
    setDropdownPlacement("bottom");
    setDropdownMaxHeight(null);
    setDropdownPosition(null);
  }, [isPopoverOpen]);

  useEffect(() => {
    if (!isPopoverOpen) {
      return;
    }

    const updateDropdownPlacement = () => {
      const trigger = dropdownTriggerRef.current;
      const content = dropdownContentRef.current;
      if (!trigger || !content) {
        return;
      }

      const triggerRect = trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const margin = 12;
      const spaceBelow = viewportHeight - triggerRect.bottom - margin;
      const spaceAbove = triggerRect.top - margin;
      const contentHeight = content.scrollHeight;
      const contentWidth = content.offsetWidth;

      const fitsBelow = contentHeight <= spaceBelow;
      const fitsAbove = contentHeight <= spaceAbove;
      let placement: "bottom" | "top" = "bottom";
      let maxHeight: number | null = null;

      if (fitsBelow || (!fitsAbove && spaceBelow >= spaceAbove)) {
        placement = "bottom";
        if (!fitsBelow) {
          maxHeight = Math.max(spaceBelow, 0);
        }
      } else {
        placement = "top";
        if (!fitsAbove) {
          maxHeight = Math.max(spaceAbove, 0);
        }
      }

      const cappedHeight =
        maxHeight !== null ? Math.min(contentHeight, maxHeight) : contentHeight;
      let desiredTop =
        placement === "bottom"
          ? triggerRect.bottom + margin
          : triggerRect.top - cappedHeight - margin;
      const desiredLeft = Math.min(
        Math.max(margin, triggerRect.left),
        viewportWidth - contentWidth - margin
      );

      if (desiredTop < margin) {
        desiredTop = margin;
        if (placement === "top") {
          maxHeight = Math.max(spaceAbove, 0);
        }
      }

      if (desiredTop + cappedHeight > viewportHeight - margin) {
        desiredTop = Math.max(margin, viewportHeight - margin - cappedHeight);
        if (placement === "bottom") {
          maxHeight = Math.max(spaceBelow, 0);
        }
      }

      setDropdownPlacement(placement);
      setDropdownMaxHeight(
        maxHeight !== null && maxHeight > 0 ? Math.floor(maxHeight) : null
      );
      setDropdownPosition({
        // Position relative to the viewport so it always aligns with the trigger.
        top: Math.round(desiredTop),
        left: Math.round(desiredLeft),
      });
    };

    // Keep the dropdown fully visible by adapting to available viewport space.
    const rafId = window.requestAnimationFrame(updateDropdownPlacement);
    window.addEventListener("resize", updateDropdownPlacement);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateDropdownPlacement);
    };
  }, [isPopoverOpen]);

  useEffect(() => {
    if (!isPopoverOpen) {
      return;
    }

    const handleScroll = (event: Event) => {
      const target = event.target as Node | null;
      if (target && dropdownContentRef.current?.contains(target)) {
        return;
      }
      setIsPopoverOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPopoverOpen(false);
      }
    };

    // Close on scroll so the dropdown never loses context on smaller viewports.
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPopoverOpen]);

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

            <div className="relative flex flex-col items-center gap-6 pt-20 px-6 max-w-6xl mx-auto text-center lg:gap-4 xl:gap-5 2xl:gap-6 lg:pt-14 xl:pt-16 2xl:pt-20">
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
                  <div
                    className={`dropdown dropdown-end ${
                      isPopoverOpen ? "dropdown-open" : ""
                    }`}
                    tabIndex={0}
                    onBlur={handlePopoverBlur}
                  >
                    <div ref={dropdownTriggerRef}>
                      <PrimaryButton
                        size="md"
                        leftIcon="ico-add-outline"
                        onClick={() => setIsPopoverOpen((prev) => !prev)}
                      >
                        Add to collection
                      </PrimaryButton>
                    </div>
                    <div
                      ref={dropdownContentRef}
                      className={`dropdown-content fixed z-[1000] w-80 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/95 shadow-xl backdrop-blur transition-[opacity,transform] duration-200 ease-out ${
                        dropdownMaxHeight ? "overflow-y-auto" : ""
                      } ${
                        isPopoverOpen && dropdownPosition
                          ? "visible opacity-100 translate-y-0 scale-100"
                          : "pointer-events-none invisible opacity-0 -translate-y-1 scale-95"
                      }`}
                      tabIndex={isPopoverOpen ? 0 : -1}
                      aria-hidden={!isPopoverOpen}
                      style={{
                        top: dropdownPosition
                          ? `${dropdownPosition.top}px`
                          : undefined,
                        left: dropdownPosition
                          ? `${dropdownPosition.left}px`
                          : undefined,
                        maxHeight: dropdownMaxHeight
                          ? `${dropdownMaxHeight}px`
                          : undefined,
                      }}
                    >
                      <div className="sticky top-0 z-1000 flex items-center justify-between gap-4 rounded-t-2xl border-b border-neutral-800 bg-neutral-900/70 px-4 py-1">
                        <span className="body-16 text-neutral-100">Add to</span>
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
                          New collection
                        </GhostButton>
                      </div>
                      <div
                        className={`px-4 pb-4 space-y-3 pr-4 gc-scrollbar ${
                          dropdownMaxHeight ? "" : "max-h-64 overflow-y-auto"
                        }`}
                      >
                        {sortedCollections.map((collection) => (
                          <label
                            key={collection}
                            className="relative flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/30 px-4 py-3 cursor-pointer transition-all duration-300 ease-out hover:bg-neutral-900"
                          >
                            <input
                              type="checkbox"
                              checked={pendingCollections.includes(collection)}
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
                  </div>
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
