"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import MainLayout from "@/components/layout/shell";
import AuthGate from "@/components/auth/auth-gate";
import { useAuth } from "@/components/auth/auth-provider";
import { useCollections } from "@/components/collections/collections-context";
import PrimaryButton from "@/components/ui/primary-button";
import GhostButton from "@/components/ui/ghost-button";
import InvertedButton from "@/components/ui/inverted-button";
import Alert from "@/components/ui/alert";
import type { Game } from "@/lib/db/games";

type GameDetailsClientProps = {
  game: Game | null;
};

type GameDetailsContentProps = {
  game: Game;
};

function GameDetailsContent({ game }: GameDetailsContentProps) {
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<number[]>(
    [],
  );
  const [pendingCollectionIds, setPendingCollectionIds] = useState<number[]>(
    [],
  );
  const {
    collections,
    recentCollectionIds,
    lastCreatedCollectionId,
    refreshCollections,
    openCreateCollection,
    showToast,
  } = useCollections();
  const [showCollectionError, setShowCollectionError] = useState(false);
  const [showCollectionsScrollbar, setShowCollectionsScrollbar] =
    useState(false);
  const [showVerificationToast, setShowVerificationToast] = useState(false);
  const [isCollectionStatusReady, setIsCollectionStatusReady] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState("Add to collections");
  const [allowEmptySelection, setAllowEmptySelection] = useState(false);
  const [drawerCtaLabel, setDrawerCtaLabel] = useState("Add");
  const collectionsScrollTimeout = useRef<number | null>(null);
  const collectionsScrollRef = useRef<HTMLDivElement | null>(null);
  const lastHandledCollectionId = useRef<number | null>(null);
  const verificationToastTimeout = useRef<number | null>(null);
  const hasLocalSelectionRef = useRef(false);
  const drawerInitializedRef = useRef(false);
  const baselineCollectionIdsRef = useRef<number[]>([]);
  const bodyOverflowRef = useRef<string | null>(null);
  const bodyPaddingRightRef = useRef<string | null>(null);
  const htmlOverflowRef = useRef<string | null>(null);
  const mainOverflowRef = useRef<string | null>(null);
  const mainPaddingRightRef = useRef<string | null>(null);
  const mainElementRef = useRef<HTMLElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const sortedCollections = [...collections].sort((a, b) => {
    const left = a.name.toLowerCase();
    const right = b.name.toLowerCase();
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  });

  useEffect(() => {
    if (isDrawerOpen) {
      setPendingCollectionIds(selectedCollectionIds);
      setShowCollectionError(false);
      if (!drawerInitializedRef.current) {
        const hadCollections = baselineCollectionIdsRef.current.length > 0;
        setDrawerTitle(
          hadCollections ? "Manage collections" : "Add to collections",
        );
        setAllowEmptySelection(hadCollections);
        setDrawerCtaLabel(hadCollections ? "Save changes" : "Add");
        drawerInitializedRef.current = true;
      }
    } else {
      drawerInitializedRef.current = false;
    }
  }, [isDrawerOpen, selectedCollectionIds]);

  useEffect(() => {
    if (!isCollectionStatusReady || isDrawerOpen) return;
    baselineCollectionIdsRef.current = [...selectedCollectionIds];
  }, [isCollectionStatusReady, isDrawerOpen, selectedCollectionIds]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    void refreshCollections();
  }, [isDrawerOpen, refreshCollections]);

  useEffect(() => {
    if (pendingCollectionIds.length > 0 && showCollectionError) {
      setShowCollectionError(false);
    }
  }, [pendingCollectionIds, showCollectionError]);

  useEffect(() => {
    hasLocalSelectionRef.current = false;
    setSelectedCollectionIds([]);
    setIsCollectionStatusReady(!user);
  }, [game.igdb_id, user]);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    let isActive = true;

    const loadCollectionsForGame = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/games/${game.igdb_id}/collections`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          collectionIds?: number[];
        };

        if (!hasLocalSelectionRef.current) {
          setSelectedCollectionIds(
            Array.isArray(data.collectionIds) ? data.collectionIds : [],
          );
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to load collections for game.", error);
      } finally {
        if (isActive) {
          setIsCollectionStatusReady(true);
        }
      }
    };

    setIsCollectionStatusReady(false);
    void loadCollectionsForGame();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [game.igdb_id, user]);

  useEffect(() => {
    if (!isDrawerOpen || !lastCreatedCollectionId) return;
    if (lastHandledCollectionId.current === lastCreatedCollectionId) return;
    const created = collections.find(
      (collection) => collection.id === lastCreatedCollectionId,
    );
    if (!created) return;
    setPendingCollectionIds((prev) =>
      prev.includes(created.id) ? prev : [...prev, created.id],
    );
    lastHandledCollectionId.current = lastCreatedCollectionId;
  }, [collections, isDrawerOpen, lastCreatedCollectionId]);

  useEffect(() => {
    return () => {
      if (collectionsScrollTimeout.current !== null) {
        window.clearTimeout(collectionsScrollTimeout.current);
      }
      if (verificationToastTimeout.current !== null) {
        window.clearTimeout(verificationToastTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isDrawerOpen) {
      if (bodyOverflowRef.current !== null) {
        document.body.style.overflow = bodyOverflowRef.current;
        bodyOverflowRef.current = null;
      }
      if (bodyPaddingRightRef.current !== null) {
        document.body.style.paddingRight = bodyPaddingRightRef.current;
        bodyPaddingRightRef.current = null;
      }
      if (htmlOverflowRef.current !== null) {
        document.documentElement.style.overflow = htmlOverflowRef.current;
        htmlOverflowRef.current = null;
      }
      if (mainElementRef.current) {
        if (mainOverflowRef.current !== null) {
          mainElementRef.current.style.overflow = mainOverflowRef.current;
          mainOverflowRef.current = null;
        }
        if (mainPaddingRightRef.current !== null) {
          mainElementRef.current.style.paddingRight = mainPaddingRightRef.current;
          mainPaddingRightRef.current = null;
        }
      }
      if (document.body.dataset.drawerScrollLocked) {
        delete document.body.dataset.drawerScrollLocked;
      }
      return;
    }

    if (bodyOverflowRef.current === null) {
      bodyOverflowRef.current = document.body.style.overflow;
    }
    if (bodyPaddingRightRef.current === null) {
      bodyPaddingRightRef.current = document.body.style.paddingRight;
    }
    if (htmlOverflowRef.current === null) {
      htmlOverflowRef.current = document.documentElement.style.overflow;
    }
    if (!mainElementRef.current) {
      mainElementRef.current = document.querySelector("main");
    }
    if (mainElementRef.current) {
      if (mainOverflowRef.current === null) {
        mainOverflowRef.current = mainElementRef.current.style.overflow;
      }
      if (mainPaddingRightRef.current === null) {
        mainPaddingRightRef.current = mainElementRef.current.style.paddingRight;
      }
    }

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight =
      scrollbarWidth > 0 ? `${scrollbarWidth}px` : "";
    document.documentElement.style.overflow = "hidden";
    if (mainElementRef.current) {
      mainElementRef.current.style.overflow = "hidden";
      mainElementRef.current.style.paddingRight =
        scrollbarWidth > 0 ? `${scrollbarWidth}px` : "";
    }
    document.body.dataset.drawerScrollLocked = "true";

    return () => {
      if (bodyOverflowRef.current !== null) {
        document.body.style.overflow = bodyOverflowRef.current;
        bodyOverflowRef.current = null;
      }
      if (bodyPaddingRightRef.current !== null) {
        document.body.style.paddingRight = bodyPaddingRightRef.current;
        bodyPaddingRightRef.current = null;
      }
      if (htmlOverflowRef.current !== null) {
        document.documentElement.style.overflow = htmlOverflowRef.current;
        htmlOverflowRef.current = null;
      }
      if (mainElementRef.current) {
        if (mainOverflowRef.current !== null) {
          mainElementRef.current.style.overflow = mainOverflowRef.current;
          mainOverflowRef.current = null;
        }
        if (mainPaddingRightRef.current !== null) {
          mainElementRef.current.style.paddingRight = mainPaddingRightRef.current;
          mainPaddingRightRef.current = null;
        }
      }
      if (document.body.dataset.drawerScrollLocked) {
        delete document.body.dataset.drawerScrollLocked;
      }
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) return;

    const isInsideDrawer = (target: EventTarget | null) => {
      if (!target || !drawerRef.current) return false;
      return drawerRef.current.contains(target as Node);
    };

    const isInsideScrollable = (target: EventTarget | null) => {
      if (!target || !collectionsScrollRef.current) return false;
      return collectionsScrollRef.current.contains(target as Node);
    };

    const handleWheel = (event: WheelEvent) => {
      if (isInsideScrollable(event.target)) {
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isInsideScrollable(event.target)) {
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const scrollKeys = new Set([
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " ",
      ]);
      if (!scrollKeys.has(event.key)) return;
      if (isInsideDrawer(document.activeElement)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });
    document.addEventListener("touchmove", handleTouchMove, {
      passive: false,
      capture: true,
    });
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("wheel", handleWheel, true);
      document.removeEventListener("touchmove", handleTouchMove, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isDrawerOpen]);

  const handleCollectionsScroll = () => {
    setShowCollectionsScrollbar(true);
    if (collectionsScrollTimeout.current !== null) {
      window.clearTimeout(collectionsScrollTimeout.current);
    }
    collectionsScrollTimeout.current = window.setTimeout(() => {
      setShowCollectionsScrollbar(false);
    }, 800);
  };

  const handleCollectionToggle = (collectionId: number) => {
    setPendingCollectionIds((prev) =>
      prev.includes(collectionId)
        ? prev.filter((item) => item !== collectionId)
        : [...prev, collectionId],
    );
  };

  const handleOpenDrawer = () => {
    if (user && !user.emailVerified) {
      setShowVerificationToast(true);
      if (verificationToastTimeout.current !== null) {
        window.clearTimeout(verificationToastTimeout.current);
      }
      verificationToastTimeout.current = window.setTimeout(() => {
        setShowVerificationToast(false);
      }, 2400);
      return;
    }
    setIsDrawerOpen(true);
  };

  const handleApplyCollections = () => {
    if (pendingCollectionIds.length === 0 && !allowEmptySelection) {
      setShowCollectionError(true);
      return;
    }
    setIsDrawerOpen(false);
    hasLocalSelectionRef.current = true;
    setSelectedCollectionIds(pendingCollectionIds);
    if (!game) {
      showToast(
        "We couldn’t add this to your collection. Please try again.",
        "error",
      );
      return;
    }

    const gameId = Number(game.igdb_id);
    const collectionIds = [...pendingCollectionIds];
    const toAdd = collectionIds.filter(
      (collectionId) => !selectedCollectionIds.includes(collectionId),
    );
    const toRemove = selectedCollectionIds.filter(
      (collectionId) => !collectionIds.includes(collectionId),
    );

    if (!user) {
      showToast(
        "We couldn’t add this to your collection. Please try again.",
        "error",
      );
      return;
    }

    void (async () => {
      try {
        const token = await user.getIdToken();
        if (toAdd.length === 0 && toRemove.length === 0) {
          return;
        }

        await Promise.all([
          ...toAdd.map(async (collectionId) => {
            const response = await fetch(
              `/api/collections/${collectionId}/games`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ igdbId: gameId }),
              },
            );

            if (!response.ok) {
              const errorBody = await response.json().catch(() => null);
              console.error("Failed to add game to collection.", {
                status: response.status,
                error: errorBody,
              });
              throw new Error("Add to collection failed");
            }
          }),
          ...toRemove.map(async (collectionId) => {
            const response = await fetch(
              `/api/collections/${collectionId}/games`,
              {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ igdbId: gameId }),
              },
            );

            if (!response.ok) {
              const errorBody = await response.json().catch(() => null);
              console.error("Failed to remove game from collection.", {
                status: response.status,
                error: errorBody,
              });
              throw new Error("Remove from collection failed");
            }
          }),
        ]);

        const hasSelections = collectionIds.length > 0;
        showToast(
          hasSelections
            ? "Collections updated"
            : "Removed from all collections",
          "success",
        );
      } catch (error) {
        console.error("Failed to add game to collection.", error);
        showToast(
          "We couldn’t update your collections. Please try again.",
          "error",
        );
      }
    })();
  };

  const renderAddToCollectionButton = (className?: string) =>
    !isCollectionStatusReady ? (
      <div
        aria-hidden="true"
        className={`h-10 ${
          className ? className : "min-w-[180px]"
        } rounded-full bg-base-200/60`}
      />
    ) : selectedCollectionIds.length > 0 ? (
      <InvertedButton
        size="md"
        leftIcon="ico-tick-outline"
        onClick={handleOpenDrawer}
        className={className}
      >
        Added (in {selectedCollectionIds.length}{" "}
        {selectedCollectionIds.length === 1 ? "collection" : "collections"})
      </InvertedButton>
    ) : (
      <PrimaryButton
        size="md"
        leftIcon="ico-add-outline"
        onClick={handleOpenDrawer}
        className={className}
      >
        Add to collection
      </PrimaryButton>
    );

  const renderWishlistButton = () => (
    <GhostButton size="md" iconOnly="ico-heart-outline" aria-label="Wishlist">
      Wishlist
    </GhostButton>
  );

  const heroBackground = game.screenshots[0] ?? game.cover_url ?? null;
  const coverUrl = game.cover_url;
  const screenshots = game.screenshots ?? [];
  const releaseYear = game.release_year ? String(game.release_year) : "—";
  const platforms = game.platforms ?? "—";
  const developers = game.developers ?? "—";
  const publishers = game.publishers ?? "—";

  return (
    <>
      {showVerificationToast ? (
        <div className="toast toast-top toast-end z-50" aria-live="polite">
          <div className="alert alert-soft alert-warning shadow-lg">
            <span className="body-14 text-base-content">
              Please verify your email address to use this feature.
            </span>
          </div>
        </div>
      ) : null}
      <div className="drawer drawer-end h-full min-h-0">
        <input
          id="add-to-collection-drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={isDrawerOpen}
          onChange={(event) => setIsDrawerOpen(event.target.checked)}
        />
        <div className="drawer-content w-full h-full min-h-0 bg-base-100 text-base-content pb-20 md:pb-0">
          {/* ===== HERO ===== */}
          <section className="relative isolate">
            {heroBackground ? (
              <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-25"
                  style={{ backgroundImage: `url(${heroBackground})` }}
                />
                <div className="absolute inset-0 bg-base-100/20 backdrop-blur-sm" />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/60 to-transparent" />
              </div>
            ) : null}

            <div className="relative z-10 flex flex-col items-center gap-6 pt-14 px-4 md:px-6 max-w-6xl mx-auto text-center lg:gap-4 xl:gap-5 2xl:gap-6 lg:pt-14 xl:pt-16 2xl:pt-20">
              {/* ===== COVER ===== */}
              <div className="relative w-[220px] md:w-[280px] lg:w-[190px] xl:w-[230px] 2xl:w-[280px] rounded-xl shadow-xl">
                {/* Compact desktops get a smaller cover so title/CTA/metadata land above the fold. */}
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt={game.title}
                    width={280}
                    height={340}
                    sizes="(min-width: 1536px) 280px, (min-width: 1280px) 230px, (min-width: 1024px) 190px, (min-width: 768px) 280px, 220px"
                    className="h-auto w-full rounded-xl object-contain"
                  />
                ) : null}
              </div>

              {/* ===== INFO ===== */}
              <div className="w-full flex flex-col items-center">
                <h1 className="pb-4 md:pb-0 heading-3 2xl:heading-2 lg:heading-3 xl:heading-4">
                  {game.title}
                </h1>
                {/* Tighter hero spacing boosts above-the-fold visibility on smaller desktops. */}
                <div className="actions hidden items-center justify-center gap-4 py-8 md:flex lg:gap-3 lg:py-4 xl:py-5 2xl:py-8">
                  {renderAddToCollectionButton()}
                  {renderWishlistButton()}
                </div>
                <p className="body-18 text-base-content/70 leading-relaxed">
                  {game.overview}
                </p>

                {/* ===== STATS SECTION ===== */}
                <section className="grid w-full grid-cols-2 md:grid-cols-4 text-center divide-x divide-base-300/40 border border-base-300/40 rounded-xl bg-base-200/25 backdrop-blur-sm mt-10 lg:mt-6 xl:mt-8 2xl:mt-10">
                  <div className="flex flex-col py-3 px-3">
                    <span className="body-14 text-base-content/50">
                      Platform
                    </span>
                    <span className="body-16 font-medium text-base-content mt-1">
                      {platforms}
                    </span>
                  </div>

                  <div className="flex flex-col py-3 px-3">
                    <span className="body-14 text-base-content/50">
                      Release Year
                    </span>
                    <span className="body-18 font-medium text-base-content mt-1">
                      {releaseYear}
                    </span>
                  </div>

                  <div className="flex flex-col py-3 px-3">
                    <span className="body-14 text-base-content/50">
                      Developer(s)
                    </span>
                    <span className="body-16 font-medium text-base-content mt-1">
                      {developers}
                    </span>
                  </div>

                  <div className="flex flex-col py-3 px-3">
                    <span className="body-14 text-base-content/50">
                      Publisher(s)
                    </span>
                    <span className="body-16 font-medium text-base-content mt-1">
                      {publishers}
                    </span>
                  </div>
                </section>
              </div>
            </div>
          </section>

          {/* ===== MEDIA GALLERY ===== */}
          <section className="px-4 pb-10 md:px-6 max-w-7xl mx-auto mt-10">
            <h2 className="heading-5 mb-4">Screenshots</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {screenshots.map((img, index) => (
                <div
                  key={`${img}-${index}`}
                  className="relative w-full aspect-video rounded-lg overflow-hidden"
                >
                  <Image
                    src={img}
                    alt={`Screenshot ${index + 1}`}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-base-300 bg-base-100/95 backdrop-blur md:hidden">
            <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-4">
              {renderAddToCollectionButton("flex-1")}
              {renderWishlistButton()}
            </div>
          </div>
        </div>

        <div className="drawer-side z-50">
          <div
            className="drawer-overlay gc-overlay-backdrop transition-opacity duration-300 ease-out"
            onClick={() => setIsDrawerOpen(false)}
          />
          <aside
            ref={drawerRef}
            className="w-full md:w-[460px] h-[100dvh] max-h-screen bg-base-100 text-base-content border-l-0 md:border-l border-base-300 flex flex-col"
          >
            <div className="sticky top-0 z-10 bg-base-100 border-b border-base-300 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="heading-4 text-base-content">
                  {drawerTitle}
                </h3>
                <GhostButton
                  size="md"
                  iconOnly="ico-cross-outline"
                  aria-label="Close drawer"
                  onClick={() => setIsDrawerOpen(false)}
                />
              </div>
            </div>

            <div
              ref={collectionsScrollRef}
              data-lenis-prevent
              className="bg-base-100 flex-1 px-4 pt-6 pb-0 md:pb-6 overflow-y-auto overscroll-contain gc-scrollbar scrollbar-thin scrollbar-track-transparent scrollbar-thumb-base-content/30"
              onScroll={handleCollectionsScroll}
            >
              <div className="flex h-full flex-col space-y-6 pb-4">
                <GhostButton
                  size="md"
                  leftIcon="ico-add-outline"
                  className="w-full justify-start bg-base-200/60 hover:bg-base-200"
                  onClick={openCreateCollection}
                >
                  New collection
                </GhostButton>
                <div className="flex-1 space-y-3 pr-1">
                  {sortedCollections.map((collection) => (
                    <label
                      key={collection.id}
                      className={`relative flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer bg-base-200/70 border border-transparent transition-all duration-300 ease-out hover:bg-base-200/90 ${
                        recentCollectionIds.has(collection.id)
                          ? "opacity-0"
                          : "opacity-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={pendingCollectionIds.includes(collection.id)}
                        onChange={() => handleCollectionToggle(collection.id)}
                        className="checkbox peer borde-primary-content bg-base-200/70 hover:bg-base-200 checked:border-transparent checked:bg-primary checked:hover:bg-primary focus:ring-0 [--chkfg:oklch(var(--pc))] cursor-pointer transition-colors duration-300 ease-out"
                      />
                      <span className="body-16 text-base-content">
                        {collection.name}
                      </span>
                      <span className="pointer-events-none absolute inset-0 rounded-xl transition-all duration-300 ease-out peer-checked:border peer-checked:border-primary peer-checked:shadow-[0_0_0_1px_oklch(var(--p)/0.6)]" />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-base-300 bg-base-100/95 px-4 py-6 backdrop-blur">
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
                {drawerCtaLabel}
                {pendingCollectionIds.length > 0
                  ? ` (${pendingCollectionIds.length})`
                  : ""}
              </PrimaryButton>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

export default function GameDetailsClient({ game }: GameDetailsClientProps) {
  return (
    <AuthGate>
      <MainLayout>
        {game ? (
          <GameDetailsContent game={game} />
        ) : (
          <div className="flex min-h-[60vh] items-center justify-center px-6 text-base-content/60">
            <span className="body-16">Game not found.</span>
          </div>
        )}
      </MainLayout>
    </AuthGate>
  );
}
