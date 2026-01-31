"use client";

import * as React from "react";
import clsx from "clsx";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useCollections } from "@/components/collections/collections-context";
import Alert from "@/components/ui/alert";
import CreateCollectionModal from "@/components/ui/create-collection-modal";
import GameCard from "@/components/ui/game-card";
import Icon from "@/components/ui/icon";
import ModalLayout from "@/components/ui/modal-layout";
import GhostButton from "@/components/ui/ghost-button";
import SecondaryButton from "@/components/ui/secondary-button";
import PrimaryButton from "@/components/ui/primary-button";
import { SearchPalette } from "@/components/ui/search-palette/search-palette";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1585076800242-945c4bb12c53?auto=format&fit=crop&w=1200&q=80";

type CollectionGame = {
  id: number;
  igdbId: number | null;
  title: string;
  coverUrl: string;
  releaseYear: number;
  addedAt: string;
  platforms: string[];
};

type CollectionDetail = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  games: CollectionGame[];
};

type SortOption = "recent" | "year-asc" | "year-desc" | "az" | "za";
type YearOption = "all" | "80s" | "90s" | "2000s" | "2010s";

type CollectionFilters = {
  sort: SortOption;
  platforms: string[];
  year: YearOption;
};

const parseCollectionSlug = (rawSlug: string | string[] | undefined) => {
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const trimmed = slug?.trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed;
};

const formatReleaseYear = (releaseYear: number) =>
  Number.isFinite(releaseYear) && releaseYear > 0
    ? String(releaseYear)
    : "Year unknown";

const normalizePlatform = (value: string) => value.trim().toLowerCase();

const DEFAULT_FILTERS: CollectionFilters = {
  sort: "recent",
  platforms: [],
  year: "all",
};

const areFiltersEqual = (left: CollectionFilters, right: CollectionFilters) => {
  if (left.sort !== right.sort) return false;
  if (left.year !== right.year) return false;
  if (left.platforms.length !== right.platforms.length) return false;
  const leftSet = new Set(left.platforms.map(normalizePlatform));
  return right.platforms.every((platform) =>
    leftSet.has(normalizePlatform(platform)),
  );
};

const countActiveFilters = (filters: CollectionFilters) => {
  let count = 0;
  if (filters.sort !== DEFAULT_FILTERS.sort) count += 1;
  if (filters.year !== DEFAULT_FILTERS.year) count += 1;
  if (filters.platforms.length > 0) count += 1;
  return count;
};

const applyFilters = (games: CollectionGame[], filters: CollectionFilters) => {
  let filtered = [...games];

  if (filters.platforms.length > 0) {
    const platformSet = new Set(filters.platforms.map(normalizePlatform));
    filtered = filtered.filter((game) =>
      game.platforms.some((platform) =>
        platformSet.has(normalizePlatform(platform)),
      ),
    );
  }

  if (filters.year !== "all") {
    const inRange = (year: number) => {
      if (!Number.isFinite(year) || year <= 0) return false;
      if (filters.year === "80s") return year >= 1980 && year <= 1989;
      if (filters.year === "90s") return year >= 1990 && year <= 1999;
      if (filters.year === "2000s") return year >= 2000 && year <= 2009;
      return year >= 2010;
    };
    filtered = filtered.filter((game) => inRange(game.releaseYear));
  }

  const compareByTitle = (a: CollectionGame, b: CollectionGame) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" });

  if (filters.sort === "az") {
    filtered.sort(compareByTitle);
  } else if (filters.sort === "za") {
    filtered.sort((a, b) => compareByTitle(b, a));
  } else if (filters.sort === "year-asc") {
    filtered.sort((a, b) => a.releaseYear - b.releaseYear);
  } else if (filters.sort === "year-desc") {
    filtered.sort((a, b) => b.releaseYear - a.releaseYear);
  } else {
    filtered.sort(
      (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
    );
  }

  return filtered;
};

const getYearOptions = (games: CollectionGame[]) => {
  const available = new Set<YearOption>();
  games.forEach((game) => {
    const year = game.releaseYear;
    if (!Number.isFinite(year) || year <= 0) return;
    if (year >= 1980 && year <= 1989) available.add("80s");
    else if (year >= 1990 && year <= 1999) available.add("90s");
    else if (year >= 2000 && year <= 2009) available.add("2000s");
    else if (year >= 2010) available.add("2010s");
  });

  const options: Array<{ value: YearOption; label: string }> = [
    { value: "all", label: "All years" },
  ];

  if (available.has("80s")) options.push({ value: "80s", label: "80s" });
  if (available.has("90s")) options.push({ value: "90s", label: "90s" });
  if (available.has("2000s")) options.push({ value: "2000s", label: "2000s" });
  if (available.has("2010s")) options.push({ value: "2010s", label: "2010s+" });

  return options;
};

const getPlatformSummary = (platforms: string[]) => {
  if (platforms.length === 0) return "All platforms";
  if (platforms.length <= 2) return platforms.join(", ");
  return `${platforms.length} platforms selected`;
};

export default function CollectionPage() {
  const params = useParams<{ slug?: string | string[] }>();
  const collectionSlug = React.useMemo(() => parseCollectionSlug(params?.slug), [params]);
  const router = useRouter();
  const { user } = useAuth();
  const { refreshCollections, showToast } = useCollections();

  const [collection, setCollection] = React.useState<CollectionDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);
  const [appliedFilters, setAppliedFilters] =
    React.useState<CollectionFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] =
    React.useState<CollectionFilters>(DEFAULT_FILTERS);
  const filtersRef = React.useRef<HTMLDivElement | null>(null);
  const [isPlatformOpen, setIsPlatformOpen] = React.useState(false);
  const platformRef = React.useRef<HTMLDivElement | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [gameToRemove, setGameToRemove] = React.useState<CollectionGame | null>(null);
  const [isRemoving, setIsRemoving] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [addingIgdbIds, setAddingIgdbIds] = React.useState<Set<number>>(
    () => new Set(),
  );
  const collectionContextQuery = React.useMemo(() => {
    if (!collection) return "";
    const params = new URLSearchParams();
    params.set("collectionSlug", collection.slug);
    params.set("collectionName", collection.name);
    return `?${params.toString()}`;
  }, [collection]);

  const availablePlatforms = React.useMemo(() => {
    if (!collection) return [];
    const platformMap = new Map<string, string>();
    collection.games.forEach((game) => {
      game.platforms.forEach((platform) => {
        const trimmed = platform.trim();
        if (!trimmed) return;
        const key = normalizePlatform(trimmed);
        if (!platformMap.has(key)) {
          platformMap.set(key, trimmed);
        }
      });
    });
    return Array.from(platformMap.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [collection]);

  const selectedPlatforms = React.useMemo(
    () =>
      availablePlatforms.filter((platform) =>
        draftFilters.platforms.some(
          (item) => normalizePlatform(item) === normalizePlatform(platform),
        ),
      ),
    [availablePlatforms, draftFilters.platforms],
  );

  const availableYearOptions = React.useMemo(() => {
    if (!collection) return [{ value: "all", label: "All years" }];
    return getYearOptions(collection.games);
  }, [collection]);

  const filteredGames = React.useMemo(() => {
    if (!collection) return [];
    return applyFilters(collection.games, appliedFilters);
  }, [collection, appliedFilters]);

  const activeFiltersCount = React.useMemo(
    () => countActiveFilters(appliedFilters),
    [appliedFilters],
  );
  const hasPendingChanges = React.useMemo(
    () => !areFiltersEqual(draftFilters, appliedFilters),
    [draftFilters, appliedFilters],
  );

  React.useEffect(() => {
    if (!user) return;
    if (!collectionSlug) {
      setIsLoading(false);
      setError("Invalid collection.");
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    const loadCollection = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/collections/${collectionSlug}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const message =
            (body && typeof body.error === "string" && body.error) ||
            "Failed to load collection.";
          throw new Error(message);
        }

        const data = (await response.json()) as CollectionDetail;
        if (isActive) {
          setCollection(data);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Failed to load collection.";
        if (isActive) {
          setError(message);
          setCollection(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadCollection();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [collectionSlug, user]);

  React.useEffect(() => {
    setAppliedFilters(DEFAULT_FILTERS);
    setDraftFilters(DEFAULT_FILTERS);
    setIsPlatformOpen(false);
  }, [collection?.id]);

  React.useEffect(() => {
    if (!isFiltersOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!filtersRef.current) return;
      if (!filtersRef.current.contains(event.target as Node)) {
        setIsFiltersOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFiltersOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFiltersOpen]);

  React.useEffect(() => {
    if (!isFiltersOpen) {
      setIsPlatformOpen(false);
    }
  }, [isFiltersOpen]);

  React.useEffect(() => {
    if (!isPlatformOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!platformRef.current) return;
      if (!platformRef.current.contains(event.target as Node)) {
        setIsPlatformOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPlatformOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlatformOpen]);

  const handlePlatformToggle = (platform: string) => {
    setDraftFilters((prev) => {
      const key = normalizePlatform(platform);
      const isSelected = prev.platforms.some(
        (item) => normalizePlatform(item) === key,
      );
      return {
        ...prev,
        platforms: isSelected
          ? prev.platforms.filter(
              (item) => normalizePlatform(item) !== key,
            )
          : [...prev.platforms, platform],
      };
    });
  };

  const handleClearAll = () => {
    setDraftFilters(DEFAULT_FILTERS);
  };

  const handleApplyFilters = () => {
    if (!hasPendingChanges) return;
    setAppliedFilters(draftFilters);
    setIsFiltersOpen(false);
  };

  const handleUpdateCollection = (updated: {
    id: number;
    name: string;
    description: string | null;
    slug: string;
  }) => {
    setCollection((prev) =>
      prev ? { ...prev, ...updated } : prev,
    );
    void refreshCollections();
    showToast("Collection updated", "success");
    setIsEditOpen(false);
    const nextPath = `/collection/${updated.id}-${updated.slug}`;
    if (collectionSlug && !collectionSlug.startsWith(`${updated.id}-`)) {
      router.replace(nextPath);
    } else if (collectionSlug && collectionSlug !== `${updated.id}-${updated.slug}`) {
      router.replace(nextPath);
    }
  };

  const collectionIgdbIds = React.useMemo(() => {
    if (!collection) return new Set<number>();
    const ids = collection.games
      .map((game) => game.igdbId)
      .filter((id): id is number => typeof id === "number");
    return new Set(ids);
  }, [collection]);

  const handleAddGame = React.useCallback(
    async (igdbId: number) => {
      if (!collection || !user) return;
      if (addingIgdbIds.has(igdbId)) return;
      setAddingIgdbIds((prev) => new Set(prev).add(igdbId));

      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/collections/${collection.id}/games`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ igdbId }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          console.error("Failed to add game to collection.", {
            status: response.status,
            error: errorBody,
          });
          return;
        }

        const data = (await response.json()) as {
          game?: {
            id: number;
            igdbId: number;
            title: string;
            coverUrl: string | null;
            releaseYear: number | null;
          };
          addedAt?: string;
          alreadyExists?: boolean;
        };

        if (!data.game || data.alreadyExists) {
          return;
        }

        setCollection((prev) => {
          if (!prev) return prev;
          if (prev.games.some((game) => game.igdbId === data.game?.igdbId)) {
            return prev;
          }
          const nextGame: CollectionGame = {
            id: data.game.id,
            igdbId: data.game.igdbId,
            title: data.game.title,
            coverUrl: data.game.coverUrl ?? "",
            releaseYear: data.game.releaseYear ?? 0,
            addedAt: data.addedAt ?? new Date().toISOString(),
            platforms: [],
          };
          return { ...prev, games: [nextGame, ...prev.games] };
        });

        showToast(`Game added to ${collection.name}`, "success");
      } catch (error) {
        console.error("Failed to add game to collection.", error);
      } finally {
        setAddingIgdbIds((prev) => {
          const next = new Set(prev);
          next.delete(igdbId);
          return next;
        });
      }
    },
    [addingIgdbIds, collection, showToast, user],
  );

  const handleConfirmRemove = async () => {
    if (!collection || !gameToRemove || !user || isRemoving) return;
    setIsRemoving(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/collections/${collection.id}/games`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gameId: gameToRemove.id }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        console.error("Failed to remove game from collection.", {
          status: response.status,
          error: errorBody,
        });
        return;
      }

      setCollection((prev) =>
        prev
          ? {
              ...prev,
              games: prev.games.filter((game) => game.id !== gameToRemove.id),
            }
          : prev,
      );
      showToast("Game removed from collection", "success");
      setGameToRemove(null);
    } catch (error) {
      console.error("Failed to remove game from collection.", error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 max-w-[1440px] mx-auto">
      {error ? (
        <Alert variant="error" icon="ico-info-circle-outline">
          <span>{error}</span>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="body-16 text-base-content/60">Loading collection...</div>
      ) : null}

      {!isLoading && collection ? (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="heading-3 text-base-content">{collection.name}</h1>
              {collection.description ? (
                <p className="body-16 text-base-content/70 max-w-3xl">
                  {collection.description}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <PrimaryButton size="sm" type="button" onClick={() => setIsSearchOpen(true)}>
                Add games
              </PrimaryButton>
              <button
                type="button"
                className="btn btn-ghost btn-sm md:btn-md"
                onClick={() => setIsEditOpen(true)}
              >
                Edit
              </button>
            </div>
          </header>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="body-14 text-base-content/60">
              Showing {filteredGames.length} of {collection.games.length} games
            </p>

            <div ref={filtersRef} className="relative">
              <button
                type="button"
                className="btn btn-outline btn-sm md:btn-md"
                onClick={() => setIsFiltersOpen((prev) => !prev)}
                aria-expanded={isFiltersOpen}
              >
                Filters{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}
              </button>

              {isFiltersOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-[320px] rounded-xl border border-base-300 bg-base-100 p-4 shadow-xl">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="body-14 text-base-content/70">
                        Sort
                      </label>
                      <select
                        className="select select-bordered w-full bg-base-100"
                        value={draftFilters.sort}
                        onChange={(event) =>
                          setDraftFilters((prev) => ({
                            ...prev,
                            sort: event.target.value as SortOption,
                          }))
                        }
                      >
                        <option value="recent">Recently added</option>
                        <option value="year-asc">
                          Release year (oldest → newest)
                        </option>
                        <option value="year-desc">
                          Release year (newest → oldest)
                        </option>
                        <option value="az">A–Z</option>
                        <option value="za">Z–A</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="body-14 text-base-content/70">
                        Platform
                      </label>
                      <div ref={platformRef} className="relative">
                        <button
                          type="button"
                          className="select select-bordered w-full flex items-center justify-between gap-3"
                          onClick={() => setIsPlatformOpen((prev) => !prev)}
                          aria-expanded={isPlatformOpen}
                        >
                          <span className="truncate text-left">
                            {getPlatformSummary(selectedPlatforms)}
                          </span>
                          <Icon
                            name="ico-chevron-down-outline"
                            size={18}
                            className="text-base-content/60"
                          />
                        </button>

                        {isPlatformOpen ? (
                          <div
                            data-lenis-prevent
                            className="absolute left-0 right-0 z-10 mt-2 max-h-48 overflow-y-auto overscroll-contain rounded-xl border border-base-300 bg-base-100 p-2 shadow-lg gc-scrollbar scrollbar-thin scrollbar-track-transparent scrollbar-thumb-base-content/30"
                          >
                            {availablePlatforms.length === 0 ? (
                              <span className="body-14 text-base-content/50">
                                No platforms available.
                              </span>
                            ) : (
                              <div className="space-y-1">
                                {availablePlatforms.map((platform) => {
                                  const isSelected = draftFilters.platforms.some(
                                    (item) =>
                                      normalizePlatform(item) ===
                                      normalizePlatform(platform),
                                  );
                                  return (
                                    <button
                                      key={platform}
                                      type="button"
                                      onClick={() => handlePlatformToggle(platform)}
                                      aria-pressed={isSelected}
                                      className={clsx(
                                        "btn btn-ghost btn-sm w-full justify-between",
                                        isSelected
                                          ? "bg-base-200/70 text-base-content"
                                          : "text-base-content/70",
                                      )}
                                    >
                                      <span className="truncate">{platform}</span>
                                      {isSelected ? (
                                        <Icon
                                          name="ico-tick-outline"
                                          size={16}
                                          className="text-base-content"
                                        />
                                      ) : null}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="body-14 text-base-content/70">
                        Year
                      </label>
                      <select
                        className="select select-bordered w-full bg-base-100"
                        value={draftFilters.year}
                        onChange={(event) =>
                          setDraftFilters((prev) => ({
                            ...prev,
                            year: event.target.value as YearOption,
                          }))
                        }
                      >
                        {availableYearOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-base-300 pt-4">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm md:btn-md"
                      onClick={handleClearAll}
                    >
                      Clear all
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm md:btn-md"
                      disabled={!hasPendingChanges}
                      onClick={handleApplyFilters}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {collection.games.length === 0 ? (
            <div className="rounded-xl border border-base-300 bg-base-200/40 p-8 text-center text-base-content/60">
              No games in this collection yet.
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="rounded-xl border border-base-300 bg-base-200/40 p-8 text-center text-base-content/60">
              No games match these filters.
            </div>
          ) : (
            <section
              aria-label="Collection games"
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            >
              {filteredGames.map((game) => (
                <div key={game.id} className="group relative">
                  <GameCard
                    cover={game.coverUrl || FALLBACK_COVER}
                    name={game.title}
                    platform={formatReleaseYear(game.releaseYear)}
                    onClick={() =>
                      router.push(`/game/${game.id}${collectionContextQuery}`)
                    }
                    className="w-full"
                  />
                  <div
                    className="dropdown dropdown-end absolute top-2 right-2"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      tabIndex={0}
                      className="btn btn-circle btn-ghost btn-sm bg-base-100/70 text-base-content/90 backdrop-blur-sm shadow-sm hover:bg-base-100/90 focus-visible:bg-base-100/90"
                      aria-label="Open game actions"
                      title="Open game actions"
                    >
                      <span className="text-lg leading-none text-base-content/90">
                        ⋯
                      </span>
                    </button>
                    <ul
                      tabIndex={0}
                      className="dropdown-content menu menu-sm mt-1 w-48 rounded-xl border border-base-300 bg-base-100 p-2 shadow-lg"
                    >
                      <li>
                        <button
                          type="button"
                          onClick={() => setGameToRemove(game)}
                        >
                          Remove from collection
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              ))}
            </section>
          )}

          <CreateCollectionModal
            open={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            mode="edit"
            collection={
              collection
                ? {
                    id: collection.id,
                    name: collection.name,
                    description: collection.description,
                  }
                : null
            }
            onUpdate={handleUpdateCollection}
            onDelete={(collectionId) => {
              setIsEditOpen(false);
              void refreshCollections();
              router.replace("/");
              if (collection?.id === collectionId) {
                setCollection(null);
              }
              showToast("Collection deleted", "success");
            }}
          />

          {gameToRemove ? (
            <ModalLayout
              onClose={() => {
                if (!isRemoving) {
                  setGameToRemove(null);
                }
              }}
              contentClassName="max-w-md bg-base-100 text-base-content"
            >
              <div className="space-y-3">
                <h3 className="heading-4 text-base-content">
                  Remove game from collection?
                </h3>
                <p className="body-16 text-base-content/70">
                  This won’t delete the game from your library.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <GhostButton
                  size="md"
                  type="button"
                  onClick={() => setGameToRemove(null)}
                  disabled={isRemoving}
                >
                  Cancel
                </GhostButton>
                <SecondaryButton
                  size="md"
                  type="button"
                  onClick={handleConfirmRemove}
                  disabled={isRemoving}
                >
                  Remove
                </SecondaryButton>
              </div>
            </ModalLayout>
          ) : null}
          <SearchPalette
            open={isSearchOpen}
            setOpen={setIsSearchOpen}
            items={[]}
            panelClassName="!max-w-3xl md:!max-w-[680px] w-[92vw]"
            collectionContext={{
              id: collection.id,
              name: collection.name,
              existingIgdbIds: collectionIgdbIds,
              addingIgdbIds,
              onAddToCollection: handleAddGame,
            }}
          />
        </>
      ) : null}
    </div>
  );
}
