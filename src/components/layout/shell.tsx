/*
 Implements the main “shell” layout: a responsive sidebar with collection links and branding, a sticky header with a command-palette style search bar, and a collapsible state that adapts to Tailwind breakpoints—every routed page renders inside this frame.
*/

"use client";

import * as React from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { CollectionsProvider } from "@/components/collections/collections-context";
import ShellContent from "@/components/shell/shell-content";
import ShellOverlays from "@/components/shell/shell-overlays";
import ShellSidebar from "@/components/shell/shell-sidebar";
import { useShellCollections } from "@/components/shell/use-shell-collections";
import { useShellSidebar } from "@/components/shell/use-shell-sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { collapsed, setCollapsed, isHydrated, isMobile } = useShellSidebar();
  const {
    sortedCollections,
    recentCollectionIds,
    collectionsContextValue,
    isCreateCollectionOpen,
    openCreateCollection,
    closeCreateCollection,
    registerCollectionCreated,
    toastConfig,
    toastKey,
    dismissToast,
  } = useShellCollections(user);

  const toggleSidebar = React.useCallback(() => {
    setCollapsed((prev) => !prev);
  }, [setCollapsed]);

  const collapseSidebar = React.useCallback(() => {
    setCollapsed(true);
  }, [setCollapsed]);

  return (
    <CollectionsProvider value={collectionsContextValue}>
      <div className="drawer min-h-[100dvh] md:h-screen bg-neutral-950 text-neutral-100 relative md:flex md:overflow-hidden">
        <input
          id="shell-drawer"
          type="checkbox"
          className="drawer-toggle md:hidden"
          checked={!collapsed && isHydrated && isMobile}
          disabled={!isMobile}
          onChange={(event) => setCollapsed(!event.target.checked)}
        />

        <ShellContent
          user={user}
          collapsed={collapsed}
          isHydrated={isHydrated}
          onToggleSidebar={toggleSidebar}
        >
          {children}
        </ShellContent>

        <ShellSidebar
          collapsed={collapsed}
          isHydrated={isHydrated}
          sortedCollections={sortedCollections}
          recentCollectionIds={recentCollectionIds}
          onCollapse={collapseSidebar}
          onOpenCreateCollection={openCreateCollection}
        />

        <ShellOverlays
          isCreateCollectionOpen={isCreateCollectionOpen}
          onCloseCreateCollection={closeCreateCollection}
          onCreateCollection={registerCollectionCreated}
          toastConfig={toastConfig}
          toastKey={toastKey}
          onToastClose={dismissToast}
        />
      </div>
    </CollectionsProvider>
  );
}
