"use client";

import clsx from "clsx";

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
  const hasCover = Boolean(lastGameCover);

  return (
    <article
      onClick={onClick}
      className={clsx(
        "group relative overflow-hidden rounded-xl bg-base-200 shadow-xl",
        "min-h-[200px] cursor-pointer transition-transform duration-200 hover:shadow-2xl",
        className
      )}
    >
      {hasCover ? (
        <div className="absolute inset-0 overflow-hidden">
          <div
            aria-hidden
            style={{ backgroundImage: `url(${lastGameCover})` }}
            className="absolute inset-[2px] scale-105 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-base-200/50" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-base-300/30 via-base-200/80 to-base-200/95" />
        </div>
      ) : null}

      <div className="relative flex h-full w-full flex-col items-center justify-end px-5 pt-10 pb-6 text-center">
        <span className="px-3 py-1 text-sm body-16 text-base-content/90">
          {title}
        </span>
        <h4 className="heading-4 weight-medium text-base-content drop-shadow-sm">
          {gamesCount} {gamesCount === 1 ? "game" : "games"}
        </h4>
      </div>
    </article>
  );
}
