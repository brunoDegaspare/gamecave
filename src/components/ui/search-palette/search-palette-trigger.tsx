"use client";

import React from "react";
import Icon, { IconName } from "@/components/ui/icon";

type Size = "sm" | "md" | "lg";

type Props = {
  onClick: () => void;
  label?: string;
  leftIconName?: IconName;
  showShortcut?: boolean;
  shortcutLabel?: string;
  className?: string;
  widthClassName?: string;
  heightClassName?: string;
  size?: Size;
  rounded?: string;
  ariaControlsId?: string;
};

const sizeMap: Record<Size, string> = {
  sm: "body-14 px-2.5",
  md: "body-16 px-3",
  lg: "body-18 px-4",
};

export default function SearchPaletteTrigger({
  onClick,
  label = "Search 1000+ game titles...",
  leftIconName = "ico-search-outline",
  showShortcut = true,
  shortcutLabel = "⌘ k",
  className = "",
  widthClassName = "",
  heightClassName = "h-10",
  size = "md",
  rounded = "rounded-lg",
  ariaControlsId,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-controls={ariaControlsId}
      className={[
        "cursor-pointer inline-flex items-center gap-2 border border-neutral-700",
        "bg-neutral-900 hover:bg-neutral-800 text-neutral-200 transition-colors",
        rounded,
        heightClassName,
        sizeMap[size],
        widthClassName,
        className,
      ].join(" ")}
    >
      {leftIconName && (
        <Icon
          name={leftIconName}
          size={24}
          className="shrink-0 text-neutral-400"
        />
      )}
      <span className="flex-1 truncate text-left">{label}</span>
      {showShortcut && (
        <kbd className="ml-1 rounded bg-neutral-800 px-1.5 py-0.5 body-14 text-neutral-400">
          {shortcutLabel}
        </kbd>
      )}
    </button>
  );
}
