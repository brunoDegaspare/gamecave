"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import SidebarNavItem from "@/components/ui/sidebar-nav-item";
import Icon from "@/components/ui/icon";
import {
  SearchPalette,
  useCommandPalette,
} from "@/components/ui/search-palette/search-palette";
import SearchPaletteTrigger from "@/components/ui/search-palette/search-palette-trigger";
import { screens } from "@root/types/tailwind-breakpoints";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { open, setOpen } = useCommandPalette();
  const [collapsed, setCollapsed] = React.useState(false);

  // Em mobile (< md) sidebar começa collapsed
  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${screens.md}px)`);

    // define o estado inicial invertido
    setCollapsed(!mediaQuery.matches);

    // atualiza automaticamente quando redimensionar
    const handleChange = (e: MediaQueryListEvent) => setCollapsed(!e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 relative">
      {/* Sidebar fixa */}
      <aside
        className={`${
          collapsed ? "w-[80px]" : "w-[300px]"
        } bg-neutral-900/70 border-r border-neutral-800 p-4 pt-4 transition-all duration-300 ease-in-out`}
      >
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
                className="text-neutral-100"
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
            href="#"
            label="Wishlist"
            iconName="ico-heart-outline"
            collapsed={collapsed}
          />
          <SidebarNavItem
            href="#"
            label="Create collection"
            iconName="ico-add-outline"
            collapsed={collapsed}
          />
        </nav>

        <nav className="pt-8 border-t border-neutral-800 space-y-2 body-18 weight-medium">
          <SidebarNavItem
            href="#"
            label="SNES"
            iconName="ico-collection-outline"
            collapsed={collapsed}
          />
          <SidebarNavItem
            href="#"
            label="Mega Drive"
            iconName="ico-collection-outline"
            collapsed={collapsed}
          />
          <SidebarNavItem
            href="#"
            label="Master System"
            iconName="ico-collection-outline"
            collapsed={collapsed}
          />
        </nav>
      </aside>

      {/* Main container */}
      <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden transition-all duration-300 ease-in-out">
        {/* Header */}
        <header className="bg-neutral-900/70 px-4 py-2 relative">
          <div className="relative mx-auto w-full px-6 py-3">
            {/* botão fixo na esquerda da header */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="cursor-pointer absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-lg hover:bg-neutral-800 transition-colors"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Icon
                name={
                  collapsed
                    ? "ico-arrow-right-outline"
                    : "ico-arrow-left-outline"
                }
                size={20}
                viewBox="0 0 24 24"
                className="w-5 h-5 text-neutral-100"
              />
            </button>

            {/* reserva espaço para o botão (w-9 + gap ~ 3.5rem) */}
            <div className="flex justify-center-safe pl-14">
              <SearchPaletteTrigger
                onClick={() => setOpen(true)}
                leftIconName="ico-search-outline"
                widthClassName="w-full max-w-[860px]"
                heightClassName="h-11"
              />

              <SearchPalette
                open={open}
                setOpen={setOpen}
                panelClassName="!max-w-3xl md:!max-w-[680px] w-[92vw]"
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
