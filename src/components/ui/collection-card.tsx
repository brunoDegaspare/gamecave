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
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/80 shadow-xl",
        "min-h-[220px] cursor-pointer transition-transform duration-200 hover:shadow-2xl",
        className
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 scale-105 bg-cover bg-center blur-[2px] transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/35" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-transparent" />

      <div className="relative flex w-full flex-col items-center gap-3 px-5 pt-8 pb-6 text-center">
        <h3 className="heading-4 text-neutral-50 drop-shadow-sm">{title}</h3>
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm font-medium text-white/90 backdrop-blur-sm">
          {gamesCount} games
        </span>
      </div>
    </article>
  );
}
