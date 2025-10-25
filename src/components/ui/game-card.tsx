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
        "flex flex-col items-center rounded-xl p-3 transition-all duration-200 hover:bg-neutral-900/60 hover:cursor-pointer hover:scale-[1.02]",
        className
      )}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg">
        <Image
          src={cover}
          alt={name}
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100px, 160px"
        />
      </div>

      <div className="mt-3 w-full text-left space-y-0.5">
        <h3 className="body-16 font-medium text-neutral-100 leading-tight line-clamp-2">
          {name}
        </h3>
        <p className="caption-12 text-neutral-500 mt-1">{platform}</p>
      </div>
    </div>
  );
}
