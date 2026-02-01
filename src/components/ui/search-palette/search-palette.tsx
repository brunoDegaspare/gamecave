"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import GhostButton from "@/components/ui/ghost-button";

type Item = {
  id: string;
  label: string;
  igdbId?: number;
  group?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action?: () => void;
};

type SearchResponse = {
  ok: boolean;
  games?: Array<{
    igdbId: number;
    title: string;
    releaseYear: number | null;
    coverUrl: string | null;
    category: "Main" | "Remake" | "Port" | "Expanded" | "Game";
  }>;
};

function groupBy<T extends { group?: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((acc, it) => {
    const key = it.group || "Other";
    (acc[key] ||= []).push(it);
    return acc;
  }, {});
}

export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k";
      const mod = e.metaKey || e.ctrlKey;
      if (isK && mod) {
        e.preventDefault();
        setOpen((p) => !p);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // bloqueia scroll do body quando aberto
  React.useEffect(() => {
    if (!open) return;
    const { classList } = document.documentElement;
    classList.add("overflow-y-hidden");
    return () => classList.remove("overflow-y-hidden");
  }, [open]);

  return { open, setOpen };
}

export function SearchPalette({
  open,
  setOpen,
  items,
  panelClassName,
  onSeeMore,
  collectionContext,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  items: Item[];
  panelClassName?: string;
  onSeeMore?: () => void;
  collectionContext?: {
    id: number;
    name: string;
    existingIgdbIds: Set<number>;
    addingIgdbIds?: Set<number>;
    onAddToCollection?: (igdbId: number) => void | Promise<void>;
  };
}) {
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [searchItems, setSearchItems] = React.useState<Item[]>([]);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const requestIdRef = React.useRef(0);
  const loadingStartRef = React.useRef<number | null>(null);
  const minLoadingMs = 400;
  const fadeDurationMs = 200;
  const fadeInTimeoutRef = React.useRef<number | null>(null);

  const resolveAndNavigate = React.useCallback(
    async (igdbId: number) => {
      try {
        const response = await fetch(
          `/api/games/resolve?igdbId=${igdbId}`,
        );
        const data = (await response.json()) as {
          ok: boolean;
          id?: number;
        };
        if (!response.ok || !data.ok || typeof data.id !== "number") {
          return;
        }
        router.push(`/game/${data.id}`);
      } catch {
        // Ignore resolve failures to keep UX consistent.
      }
    },
    [router],
  );

  React.useEffect(() => {
    if (open) {
      setIsMounted(true);
      setIsVisible(false);
      if (fadeInTimeoutRef.current) {
        window.clearTimeout(fadeInTimeoutRef.current);
      }
      fadeInTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(true);
      }, 20);
      return;
    }

    if (!isMounted) return;
    setIsVisible(false);
    if (fadeInTimeoutRef.current) {
      window.clearTimeout(fadeInTimeoutRef.current);
      fadeInTimeoutRef.current = null;
    }
    const timeout = setTimeout(() => {
      requestIdRef.current += 1;
      loadingStartRef.current = null;
      setQuery("");
      setSearchItems([]);
      setHasSearched(false);
      setIsLoading(false);
      setIsMounted(false);
    }, fadeDurationMs);

    return () => clearTimeout(timeout);
  }, [open, isMounted]);

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  React.useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      requestIdRef.current += 1;
      loadingStartRef.current = null;
      setSearchItems([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      loadingStartRef.current = Date.now();
      setIsLoading(true);
      setHasSearched(false);
      setSearchItems([]);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as SearchResponse;
        if (!response.ok || !data.ok) {
          if (requestId !== requestIdRef.current) return;
          setSearchItems([]);
          return;
        }
        const nextItems =
          data.games?.map((game) => ({
            id: String(game.igdbId),
            igdbId: game.igdbId,
            label: game.title,
            group: "Games",
            action: () => {
              void resolveAndNavigate(game.igdbId);
            },
          })) ?? [];
        if (requestId !== requestIdRef.current) return;
        setSearchItems(nextItems);
        setHasSearched(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (requestId !== requestIdRef.current) return;
        setSearchItems([]);
        setHasSearched(true);
      } finally {
        if (requestId !== requestIdRef.current) return;
        const startedAt = loadingStartRef.current;
        const elapsed = startedAt ? Date.now() - startedAt : 0;
        const remaining = Math.max(0, minLoadingMs - elapsed);
        if (remaining > 0) {
          setTimeout(() => {
            if (requestId !== requestIdRef.current) return;
            setIsLoading(false);
          }, remaining);
        } else {
          setIsLoading(false);
        }
      }
    }, 500);

    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [open, query]);

  const maxResults = 10;
  const visibleSearchItems =
    searchItems.length > maxResults
      ? searchItems.slice(0, maxResults)
      : searchItems;
  const hasMoreResults = searchItems.length > maxResults;
  const combinedItems = React.useMemo(
    () => [...items, ...visibleSearchItems],
    [items, visibleSearchItems],
  );
  const combinedGroups = groupBy(combinedItems);
  const trimmedQuery = query.trim();
  const showEmpty =
    hasSearched &&
    !isLoading &&
    trimmedQuery.length >= 2 &&
    searchItems.length === 0;

  if (!isMounted) return null;

  return createPortal(
    <div
      className={[
        "fixed inset-0 z-[100000] gc-scrollbar transition-opacity duration-300 ease-out",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
      ].join(" ")}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop: dim + blur */}
      <div
        className={[
          "absolute inset-0 bg-base-100/70 transition-opacity duration-300 ease-out",
          isVisible ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />

      {/* Painel */}
      <div
        className={[
          "absolute left-1/2 top-24 w-full max-w-[700px] p-4 -translate-x-1/2 overflow-hidden rounded-xl border border-base-300 bg-base-200/95 shadow-2xl transition-[opacity,transform] duration-300 ease-out",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]",
          panelClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          label="Global Search"
          className="w-full text-base-content"
          loop
          shouldFilter={false}
        >
          {collectionContext?.name ? (
            <div className="px-4 pt-3 text-xs text-base-content/60">
              Adding games to {collectionContext.name}
            </div>
          ) : null}
          <div className="relative">
            <Command.Input
              autoFocus
              placeholder="Type to search..."
              value={query}
              onValueChange={setQuery}
              className="w-full bg-transparent px-4 py-3 text-base placeholder-base-content/50 outline-none"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-base-300 px-2 py-1 text-[10px] text-base-content/50">
              Esc
            </kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-auto border-t border-base-300">
            {isLoading && (
              <div className="flex items-center gap-2 px-4 py-4 text-sm text-base-content/50">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-base-content/30 border-t-transparent" />
                Searching...
              </div>
            )}
            {showEmpty && (
              <Command.Empty className="px-4 py-6 text-sm text-base-content/50">
                No results found.
              </Command.Empty>
            )}

            {Object.entries(combinedGroups).map(([heading, groupItems]) => (
              <Command.Group key={heading} heading={heading} className="p-1">
                {groupItems.map((it) => (
                  <Command.Item
                    key={it.id}
                    value={`${it.label}__${it.id}`}
                    onSelect={() => {
                      setOpen(false);
                      it.action?.();
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-base-300 data-[selected=true]:text-base-content"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-base-300 text-[12px]">
                      {it.icon ?? "🔎"}
                    </span>
                    <span className="flex-1">{it.label}</span>
                    {collectionContext && typeof it.igdbId === "number" ? (
                      <button
                        type="button"
                        className={`btn btn-xs ${
                          collectionContext.existingIgdbIds.has(it.igdbId) ||
                          collectionContext.addingIgdbIds?.has(it.igdbId)
                            ? "btn-ghost"
                            : "btn-primary"
                        }`}
                        disabled={
                          collectionContext.existingIgdbIds.has(it.igdbId) ||
                          collectionContext.addingIgdbIds?.has(it.igdbId)
                        }
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (
                            collectionContext.existingIgdbIds.has(it.igdbId) ||
                            collectionContext.addingIgdbIds?.has(it.igdbId)
                          ) {
                            return;
                          }
                          collectionContext.onAddToCollection?.(it.igdbId);
                        }}
                      >
                        {collectionContext.existingIgdbIds.has(it.igdbId)
                          ? "✓ Added"
                          : collectionContext.addingIgdbIds?.has(it.igdbId)
                            ? "Adding..."
                            : "Add to collection"}
                      </button>
                    ) : null}
                    {it.shortcut && (
                      <kbd className="rounded bg-base-300 px-1.5 py-0.5 text-[10px] text-base-content/50">
                        {it.shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
            {hasMoreResults && (
              <Command.Item
                value="see-more"
                forceMount
                onSelect={() => {
                  setOpen(false);
                  onSeeMore?.();
                }}
                asChild
              >
                <GhostButton
                  size="md"
                  type="button"
                  className="w-full justify-center"
                >
                  See more
                </GhostButton>
              </Command.Item>
            )}
          </Command.List>
        </Command>
      </div>
    </div>,
    document.body,
  );
}
