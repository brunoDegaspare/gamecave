"use client";

import * as React from "react";

export type CollectionSummary = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
};

export type CollectionsContextValue = {
  collections: CollectionSummary[];
  recentCollectionIds: Set<number>;
  lastCreatedCollectionId: number | null;
  refreshCollections: () => Promise<void>;
  registerCollectionCreated: (collection: CollectionSummary) => void;
  openCreateCollection: () => void;
};

const CollectionsContext = React.createContext<CollectionsContextValue | null>(
  null,
);

export const CollectionsProvider = CollectionsContext.Provider;

export const useCollections = () => {
  const context = React.useContext(CollectionsContext);
  if (!context) {
    throw new Error("useCollections must be used within CollectionsProvider.");
  }
  return context;
};
