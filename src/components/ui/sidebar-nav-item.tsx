"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Icon from "@/components/ui/icon";
import { iconsMap, IconName } from "@/components/generated/icons-map";

// type guard: aceita qualquer valor e confirma se é um ícone válido
function isIconName(v: unknown): v is IconName {
  return typeof v === "string" && v in iconsMap;
}

type SidebarNavItemProps = {
  href: string;
  label: string;
  iconName?: string;
  showIcon?: boolean;
  isActive?: boolean;
};

export default function SidebarNavItem({
  href,
  label,
  iconName,
  showIcon = true,
  isActive,
}: SidebarNavItemProps) {
  const pathname = usePathname();

  // Detecta automaticamente o item ativo
  const active = isActive ?? pathname === href;
  const finalIconName =
    iconName && active && iconName.includes("-outline")
      ? iconName.replace("-outline", "-bold")
      : iconName;

  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 rounded-xl py-3 px-3 text-base font-medium transition-colors",
        active
          ? "bg-neutral-800 text-purple-400"
          : "text-neutral-300 hover:bg-neutral-800"
      )}
      aria-current={active ? "page" : undefined}
    >
      {showIcon && isIconName(finalIconName) && (
        <div className="w-6 h-6">
          <Icon
            name={finalIconName}
            size={24}
            viewBox="0 0 24 24"
            className="w-full h-full"
          />
        </div>
      )}
      <span>{label}</span>
    </Link>
  );
}
