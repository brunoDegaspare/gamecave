"use client";

import * as React from "react";
import type { User } from "firebase/auth";
import type {
  CollectionSummary,
  CollectionsContextValue,
} from "@/components/collections/collections-context";
import type { ToastVariant } from "@/components/ui/toast";

type ToastConfig = {
  message: string;
  variant: ToastVariant;
};

export function useShellCollections(user: User | null) {
  const [collections, setCollections] = React.useState<CollectionSummary[]>([]);
  const sortedCollections = React.useMemo(
    () =>
      [...collections].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    [collections],
  );
  const [recentCollectionIds, setRecentCollectionIds] = React.useState(
    () => new Set<number>(),
  );
  const [lastCreatedCollectionId, setLastCreatedCollectionId] = React.useState<
    number | null
  >(null);
  const [toastKey, setToastKey] = React.useState(0);
  const [toastConfig, setToastConfig] = React.useState<ToastConfig | null>(null);
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] =
    React.useState(false);

  const refreshCollections = React.useCallback(async () => {
    if (!user) {
      setCollections([]);
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/collections", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        console.error("Failed to load collections.", {
          status: response.status,
          error: errorBody,
        });
        return;
      }

      const data = (await response.json()) as CollectionSummary[];
      setCollections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load collections.", error);
    }
  }, [user]);

  React.useEffect(() => {
    void refreshCollections();
  }, [refreshCollections]);

  const registerCollectionCreated = React.useCallback(
    (created: CollectionSummary) => {
      setCollections((prev) =>
        prev.some((collection) => collection.id === created.id)
          ? prev
          : [created, ...prev],
      );
      setLastCreatedCollectionId(created.id);
      setToastKey((prev) => prev + 1);
      setToastConfig({
        message: "Collection created successfully.",
        variant: "success",
      });
      setRecentCollectionIds((prev) => {
        const next = new Set(prev);
        next.add(created.id);
        return next;
      });
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          setRecentCollectionIds((prev) => {
            const next = new Set(prev);
            next.delete(created.id);
            return next;
          });
        });
      }
    },
    [],
  );

  const openCreateCollection = React.useCallback(() => {
    setIsCreateCollectionOpen(true);
  }, []);

  const closeCreateCollection = React.useCallback(() => {
    setIsCreateCollectionOpen(false);
  }, []);

  const showToast = React.useCallback((message: string, variant: ToastVariant) => {
    setToastKey((prev) => prev + 1);
    setToastConfig({ message, variant });
  }, []);

  const dismissToast = React.useCallback(() => {
    setToastConfig(null);
  }, []);

  const collectionsContextValue: CollectionsContextValue = React.useMemo(
    () => ({
      collections,
      recentCollectionIds,
      lastCreatedCollectionId,
      refreshCollections,
      registerCollectionCreated,
      openCreateCollection,
      showToast,
    }),
    [
      collections,
      recentCollectionIds,
      lastCreatedCollectionId,
      refreshCollections,
      registerCollectionCreated,
      openCreateCollection,
      showToast,
    ],
  );

  return {
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
  };
}
