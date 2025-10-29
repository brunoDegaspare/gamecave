"use client";

import React from "react";

type TooltipProps = {
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
};

export function Tooltip({ content, side = "top", children }: TooltipProps) {
  // Define the tooltip position based on the side prop
  const positionClasses = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  }[side];

  // Define the arrow position and direction based on the side prop
  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-neutral-800",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-neutral-800",
    left: "left-full top-1/2 -translate-y-1/2 border-l-neutral-800",
    right: "right-full top-1/2 -translate-y-1/2 border-r-neutral-800",
  }[side];

  return (
    <div className="relative inline-flex group">
      {children}

      {/* Tooltip container */}
      <span
        role="tooltip"
        className={`
          pointer-events-none absolute z-50 whitespace-nowrap
          rounded-md bg-neutral-800 px-2 py-1 body-14 text-neutral-100
          opacity-0 shadow-lg ring-1 ring-black/20 transition-opacity duration-150 delay-180
          group-hover:opacity-100 group-focus-within:opacity-100
          ${positionClasses}
        `}
      >
        {content}

        {/* Tooltip arrow */}
        <span
          className={`absolute h-0 w-0 border-4 border-transparent ${arrowClasses}`}
        ></span>
      </span>
    </div>
  );
}
