"use client";

import Image from "next/image";
import Link from "next/link";
import SidebarNavItem from "@/components/sidebar-nav-item";
import { SearchPalette, useCommandPalette } from "@/components/search-palette";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mainLogo = { width: "200px", height: "60px" };
  const { open, setOpen } = useCommandPalette();

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100">
      {/* Sidebar fixa */}
      <aside className="w-[300px] border-r border-neutral-800 p-4 pt-4">
        <div className="pt-2 pb-2 mb-10">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/assets/gamecave-logo-beta.svg"
              alt="GameCave logo"
              width={200}
              height={60}
              priority
            />
          </Link>
        </div>

        <nav className="mt-4 pb-8 space-y-2 text-sm">
          <SidebarNavItem href="/" label="Home" iconName="ico-home-outline" />
          <SidebarNavItem
            href="#"
            label="Wishlist"
            iconName="ico-heart-outline"
          />
          <SidebarNavItem
            href="#"
            label="Create collection"
            iconName="ico-add-outline"
          />
        </nav>

        <nav className="pt-8 border-t border-neutral-800 space-y-2 text-sm">
          <SidebarNavItem
            href="#"
            label="SNES"
            iconName="ico-collection-outline"
          />
          <SidebarNavItem
            href="#"
            label="Mega Drive"
            iconName="ico-collection-outline"
          />
          <SidebarNavItem
            href="#"
            label="Master System"
            iconName="ico-collection-outline"
          />
        </nav>
      </aside>

      {/* Main container */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-center border-b border-neutral-800 px-4 py-2">
          <div className="p-2">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800"
            >
              Search…{" "}
              <span className="ml-2 rounded bg-neutral-800 px-1.5 text-xs">
                ⌘K
              </span>
            </button>

            <SearchPalette open={open} setOpen={setOpen} />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 bg-neutral-950">{children}</main>
      </div>
    </div>
  );
}
