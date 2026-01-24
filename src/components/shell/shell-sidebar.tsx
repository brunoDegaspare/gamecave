"use client";

import Image from "next/image";
import Link from "next/link";
import SidebarNavItem from "@/components/ui/sidebar-nav-item";
import Icon from "@/components/ui/icon";
import GhostButton from "@/components/ui/ghost-button";
import type { CollectionSummary } from "@/components/collections/collections-context";

type ShellSidebarProps = {
  collapsed: boolean;
  isHydrated: boolean;
  sortedCollections: CollectionSummary[];
  recentCollectionIds: Set<number>;
  onCollapse: () => void;
  onOpenCreateCollection: () => void;
};

export default function ShellSidebar({
  collapsed,
  isHydrated,
  sortedCollections,
  recentCollectionIds,
  onCollapse,
  onOpenCreateCollection,
}: ShellSidebarProps) {
  return (
    <div className="drawer-side bg-base-200 border-r-0 md:border-r border-base-200 md:order-1 md:static md:visible md:opacity-100 md:pointer-events-auto md:overflow-visible md:flex-none md:w-auto">
      <label
        htmlFor="shell-drawer"
        className={`drawer-overlay md:hidden ${!isHydrated ? "invisible" : ""}`}
        onClick={onCollapse}
        aria-label="Close sidebar"
      />
      <aside
        className={`${
          !isHydrated
            ? "invisible pointer-events-none md:visible md:pointer-events-auto"
            : ""
        } w-full ${
          collapsed ? "md:w-[80px]" : "md:w-[300px]"
        } md:[translate:0] p-4 pt-4 transition-all duration-300 ease-in-out`}
      >
        {!collapsed && (
          <div className="md:hidden absolute right-4 top-4">
            <GhostButton
              size="md"
              iconOnly="ico-arrow-left-outline"
              aria-label="Close sidebar"
              onClick={onCollapse}
            />
          </div>
        )}
        <div className="pt-2 pb-2 mb-10 flex items-center justify-center">
          <Link href="/" className="flex items-center gap-2">
            {!collapsed ? (
              <Image
                src="/assets/gamecave-logo-beta.svg"
                alt="GameCave logo"
                width={200}
                height={60}
                priority
              />
            ) : (
              <Icon
                name="ico-controller-outline"
                size={24}
                viewBox="0 0 24 24"
                className="text-base-content"
              />
            )}
          </Link>
        </div>

        <nav className="mt-4 pb-8 space-y-2 body-18 weight-medium">
          <SidebarNavItem
            href="/"
            label="Dashboard"
            iconName="ico-home-outline"
            collapsed={collapsed}
          />
          <SidebarNavItem
            href="/account"
            label="Account"
            iconName="ico-user-outline"
            collapsed={collapsed}
          />
          <SidebarNavItem
            href="#"
            label="Wishlist"
            iconName="ico-heart-outline"
            collapsed={collapsed}
          />
          <SidebarNavItem
            href="#"
            label="New collection"
            iconName="ico-add-outline"
            collapsed={collapsed}
            onClick={(event) => {
              event.preventDefault();
              onOpenCreateCollection();
            }}
          />
        </nav>

        {sortedCollections.length > 0 ? (
          <nav className="pt-8 border-t border-base-100 space-y-2 body-18 weight-medium">
            {sortedCollections.map((collection) => (
              <SidebarNavItem
                key={collection.id}
                href="#"
                label={collection.name}
                iconName="ico-collection-outline"
                collapsed={collapsed}
                className={`transition-opacity duration-300 ease-out ${
                  recentCollectionIds.has(collection.id)
                    ? "opacity-0"
                    : "opacity-100"
                }`}
              />
            ))}
          </nav>
        ) : null}
      </aside>
    </div>
  );
}
