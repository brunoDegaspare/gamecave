"use client";

import Image from "next/image";
import Link from "next/link";
import SidebarNavItem from "@/components/ui/sidebar-nav-item";
import {
  SearchPalette,
  useCommandPalette,
} from "@/components/ui/search-palette/search-palette";
import SearchPaletteTrigger from "@/components/ui/search-palette/search-palette-trigger";

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
      <aside className="w-[300px] bg-neutral-900/70 border-r border-neutral-800 p-4 pt-4">
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

        <nav className="mt-4 pb-8 space-y-2 body-18 weight-medium">
          <SidebarNavItem
            href="/"
            label="Dashboard"
            iconName="ico-home-outline"
          />
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

        <nav className="pt-8 border-t border-neutral-800 space-y-2 body-18 weight-medium">
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
        <header className="bg-neutral-900/70 px-4 py-2">
          <div className="p-2 w-full flex items-center justify-center">
            <SearchPaletteTrigger
              onClick={() => setOpen(true)}
              leftIconName="ico-search-outline"
              widthClassName="w-full max-w-[880px]" // width
              heightClassName="h-11" // height
            />

            <SearchPalette
              open={open}
              setOpen={setOpen}
              panelClassName="!max-w-3xl md:!max-w-[680px] w-[92vw]"
            />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
