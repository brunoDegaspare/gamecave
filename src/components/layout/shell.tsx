/*
 Implements the main “shell” layout: a responsive sidebar with collection links and branding, a sticky header with a command-palette style search bar, and a collapsible state that adapts to Tailwind breakpoints—every routed page renders inside this frame.
*/

"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import SidebarNavItem from "@/components/ui/sidebar-nav-item";
import Icon from "@/components/ui/icon";
import GhostButton from "@/components/ui/ghost-button";
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
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const scrollLockPosition = React.useRef(0);

  // Em mobile (< md) sidebar começa collapsed
  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${screens.md}px)`);

    // define o estado inicial invertido
    setCollapsed(!mediaQuery.matches);
    setIsMobile(!mediaQuery.matches);
    setIsHydrated(true);

    // atualiza automaticamente quando redimensionar
    const handleChange = (e: MediaQueryListEvent) => {
      setCollapsed(!e.matches);
      setIsMobile(!e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    const body = document.body;
    const html = document.documentElement;
    if (isMobile && !collapsed) {
      scrollLockPosition.current = window.scrollY || window.pageYOffset;
      body.style.position = "fixed";
      body.style.top = `-${scrollLockPosition.current}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
      html.style.overflow = "hidden";
    } else {
      const restoreY = scrollLockPosition.current;
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      html.style.overflow = "";
      if (restoreY) {
        window.scrollTo(0, restoreY);
      }
    }
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      html.style.overflow = "";
    };
  }, [collapsed, isHydrated, isMobile]);

  return (
    <div className="drawer min-h-[100dvh] md:h-screen bg-neutral-950 text-neutral-100 relative md:flex md:overflow-hidden">
      <input
        id="shell-drawer"
        type="checkbox"
        className="drawer-toggle md:hidden"
        checked={!collapsed && isHydrated && isMobile}
        disabled={!isMobile}
        onChange={(event) => setCollapsed(!event.target.checked)}
      />

      <div className="drawer-content flex flex-1 flex-col min-h-0 min-w-0 md:order-2 md:overflow-x-hidden transition-all duration-300 ease-in-out">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-neutral-900/70 backdrop-blur-md border-b border-neutral-800">
          <div className="relative mx-auto w-full px-6 py-3">
            {/* botão fixo na esquerda da header */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="cursor-pointer absolute left-6 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-lg hover:bg-neutral-800 transition-colors"
              aria-label={
                isHydrated
                  ? collapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
                  : "Toggle sidebar"
              }
            >
              {isHydrated ? (
                <Icon
                  name={
                    collapsed
                      ? "ico-arrow-right-outline"
                      : "ico-arrow-left-outline"
                  }
                  size={24}
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-neutral-100"
                />
              ) : (
                <>
                  <Icon
                    name="ico-arrow-right-outline"
                    size={24}
                    viewBox="0 0 24 24"
                    className="w-5 h-5 text-neutral-100 md:hidden"
                  />
                  <Icon
                    name="ico-arrow-left-outline"
                    size={24}
                    viewBox="0 0 24 24"
                    className="hidden md:block w-5 h-5 text-neutral-100"
                  />
                </>
              )}
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
                items={[]}
                panelClassName="!max-w-3xl md:!max-w-[680px] w-[92vw]"
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 min-h-0 overflow-visible md:overflow-y-auto gc-scrollbar">
          {children}
        </main>
      </div>

      <div className="drawer-side bg-neutral-900 border-r-0 md:border-r border-neutral-800 md:order-1 md:static md:visible md:opacity-100 md:pointer-events-auto md:overflow-visible md:flex-none md:w-auto">
        <label
          htmlFor="shell-drawer"
          className={`drawer-overlay md:hidden ${
            !isHydrated ? "invisible" : ""
          }`}
          onClick={() => setCollapsed(true)}
          aria-label="Close sidebar"
        />
        {/* Sidebar fixa */}
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
                onClick={() => setCollapsed(true)}
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
      </div>
    </div>
  );
}
