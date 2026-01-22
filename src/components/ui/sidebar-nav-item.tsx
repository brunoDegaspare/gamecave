"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Icon from "@/components/ui/icon";
import { iconsMap, IconName } from "@/components/generated/icons-map";
import { Tooltip } from "@/components/ui/tooltip"; // ✅ import Tooltip

// Type guard: ensures the icon name exists in the icon map
function isIconName(v: unknown): v is IconName {
  return typeof v === "string" && v in iconsMap;
}

type SidebarNavItemProps = {
  href: string;
  label: string;
  iconName?: string;
  showIcon?: boolean;
  isActive?: boolean;
  collapsed?: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export default function SidebarNavItem({
  href,
  label,
  iconName,
  showIcon = true,
  isActive,
  collapsed = false,
  onClick,
}: SidebarNavItemProps) {
  const pathname = usePathname();

  // Automatically detect the active item
  const active = isActive ?? pathname === href;
  const finalIconName =
    iconName && active && iconName.includes("-outline")
      ? iconName.replace("-outline", "-bold")
      : iconName;

  // Reusable link content
  const linkContent = (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        "group flex items-center rounded-xl py-3 px-3 text-base font-medium transition-colors",
        active
          ? "bg-neutral-800 text-purple-400"
          : "text-neutral-300 hover:bg-neutral-800",
        collapsed ? "justify-center" : "gap-3"
      )}
      aria-current={active ? "page" : undefined}
    >
      {showIcon && isIconName(finalIconName) && (
        <div className="w-6 h-6 flex-shrink-0">
          <Icon
            name={finalIconName}
            size={24}
            viewBox="0 0 24 24"
            className="w-full h-full"
          />
        </div>
      )}

      {/* Hide label when collapsed */}
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  // ✅ Show tooltip only when collapsed
  return collapsed ? (
    <Tooltip content={label} side="right">
      {linkContent}
    </Tooltip>
  ) : (
    linkContent
  );
}
