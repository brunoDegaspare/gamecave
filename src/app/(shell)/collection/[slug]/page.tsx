"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import Alert from "@/components/ui/alert";
import GameCard from "@/components/ui/game-card";

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

export default function CollectionPage() {
  const params = useParams<{ slug?: string | string[] }>();
  const collectionSlug = React.useMemo(() => parseCollectionSlug(params?.slug), [params]);
  const { user } = useAuth();

  const [collection, setCollection] = React.useState<CollectionDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
          <header className="space-y-2">
            <h1 className="heading-3 text-base-content">{collection.name}</h1>
            {collection.description ? (
              <p className="body-16 text-base-content/70 max-w-3xl">
                {collection.description}
              </p>
            ) : null}
          </header>

          {collection.games.length === 0 ? (
            <div className="rounded-xl border border-base-300 bg-base-200/40 p-8 text-center text-base-content/60">
              No games in this collection yet.
            </div>
          ) : (
            <section
              aria-label="Collection games"
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            >
              {collection.games.map((game) => (
                <GameCard
                  key={game.id}
                  cover={game.coverUrl || FALLBACK_COVER}
                  name={game.title}
                  platform={formatReleaseYear(game.releaseYear)}
                  className="w-full"
                />
              ))}
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}
