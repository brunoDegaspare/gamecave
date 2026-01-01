"use client";

import clsx from "clsx";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1585076800242-945c4bb12c53?auto=format&fit=crop&w=1200&q=80";

type CollectionCardProps = {
  title: string;
  gamesCount: number;
  lastGameCover?: string;
  className?: string;
  onClick?: () => void;
};

export default function CollectionCard({
  title,
  gamesCount,
  lastGameCover,
  className,
  onClick,
}: CollectionCardProps) {
  const backgroundImage = lastGameCover || FALLBACK_COVER;

  return (
    <article
      onClick={onClick}
      className={clsx(
        "group relative overflow-hidden rounded-xl bg-neutral-900 shadow-xl",
        "min-h-[200px] cursor-pointer transition-transform duration-200 hover:shadow-2xl",
        className
      )}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          aria-hidden
          style={{ backgroundImage: `url(${backgroundImage})` }}
          className="absolute inset-[2px] scale-105 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-neutral-900/50" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-neutral-800/30 via-neutral-900/80 to-neutral-900/95" />
      </div>

      <div className="relative flex h-full w-full flex-col items-center justify-end px-5 pt-10 pb-6 text-center">
        <span className="px-3 py-1 text-sm body-16 text-white/90">{title}</span>
        <h4 className="heading-4 weight-medium text-neutral-50 drop-shadow-sm">
          {gamesCount} games
        </h4>
      </div>
    </article>
  );
}
