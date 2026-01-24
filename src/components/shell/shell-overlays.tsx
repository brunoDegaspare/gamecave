"use client";

import CreateCollectionModal from "@/components/ui/create-collection-modal";
import Toast, { type ToastVariant } from "@/components/ui/toast";
import type { CollectionSummary } from "@/components/collections/collections-context";

type ToastConfig = {
  message: string;
  variant: ToastVariant;
};

type ShellOverlaysProps = {
  isCreateCollectionOpen: boolean;
  onCloseCreateCollection: () => void;
  onCreateCollection: (collection: CollectionSummary) => void;
  toastConfig: ToastConfig | null;
  toastKey: number;
  onToastClose: () => void;
};

export default function ShellOverlays({
  isCreateCollectionOpen,
  onCloseCreateCollection,
  onCreateCollection,
  toastConfig,
  toastKey,
  onToastClose,
}: ShellOverlaysProps) {
  return (
    <>
      <CreateCollectionModal
        open={isCreateCollectionOpen}
        onClose={onCloseCreateCollection}
        onCreate={onCreateCollection}
      />
      {toastConfig ? (
        <Toast
          key={toastKey}
          message={toastConfig.message}
          variant={toastConfig.variant}
          onClose={onToastClose}
          offset={0}
        />
      ) : null}
    </>
  );
}
