"use client";

import React from "react";
import Image from "next/image";
import clsx from "clsx";

type GameCardProps = {
  cover: string; // Cover URL
  name: string; // Game title
  platform: string; // Plataform name
  onClick?: () => void; // (optional) card click action
  className?: string; // (optional) extra classes
};

export default function GameCard({
  cover,
  name,
  platform,
  onClick,
  className,
}: GameCardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "flex flex-col items-center rounded-xl bg-neutral-900/60 p-3 transition-all duration-200 hover:bg-neutral-800 hover:cursor-pointer hover:scale-[1.02]",
        className
      )}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg">
        <Image
          src={cover}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100px, 160px"
        />
      </div>

      <div className="mt-3 w-full text-center">
        <h3 className="text-sm font-medium text-neutral-100 truncate">
          {name}
        </h3>
        <p className="text-xs text-neutral-500">{platform}</p>
      </div>
    </div>
  );
}
