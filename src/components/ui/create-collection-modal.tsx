"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useAuth } from "@/components/auth/auth-provider";
import { useCollections } from "@/components/collections/collections-context";
import AuthField from "@/components/auth/auth-field";
import GhostButton from "@/components/ui/ghost-button";
import ModalLayout from "@/components/ui/modal-layout";
import PrimaryButton from "@/components/ui/primary-button";
import TextArea from "@/components/ui/text-area";

type CreateCollectionResponse = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
};

type CollectionModalMode = "create" | "edit";

type EditableCollection = {
  id: number;
  name: string;
  description: string | null;
};

type CreateCollectionModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate?: (collection: CreateCollectionResponse) => void;
  onUpdate?: (collection: CreateCollectionResponse) => void;
  onDelete?: (collectionId: number) => void;
  mode?: CollectionModalMode;
  collection?: EditableCollection | null;
};

const DESCRIPTION_MAX_LENGTH = 300;

export default function CreateCollectionModal({
  open,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  mode = "create",
  collection,
}: CreateCollectionModalProps) {
  const { user } = useAuth();
  const { showToast } = useCollections();
  const closeRef = useRef<(() => void) | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && collection) {
      setName(collection.name);
      setDescription(
        (collection.description ?? "").slice(0, DESCRIPTION_MAX_LENGTH),
      );
    } else {
      setName("");
      setDescription("");
    }
    setIsSubmitting(false);
  }, [collection, mode, open]);

  const trimmedName = name.trim();
  const canSubmit = Boolean(trimmedName) && !isSubmitting;
  const descriptionCount = description.length;
  const isDescriptionNearLimit =
    descriptionCount >= DESCRIPTION_MAX_LENGTH - 50;
  const descriptionCounterClassName = isDescriptionNearLimit
    ? "caption-12 text-base-content/70 font-medium"
    : "caption-12 text-base-content/50";
  const helperText = useMemo(() => {
    if (isSubmitting) {
      return mode === "edit" ? "Saving..." : "Creating...";
    }
    return mode === "edit" ? "Save changes" : "Create";
  }, [isSubmitting, mode]);

  const handleRequestClose = () => {
    if (closeRef.current) {
      closeRef.current();
      return;
    }
    onClose();
  };

  const handleSubmit = () => {
    if (!trimmedName || isSubmitting) return;
    const payload = {
      name: trimmedName,
      description: description.trim() || undefined,
    };
    setIsSubmitting(true);
    window.setTimeout(() => {
      void (async () => {
        try {
          if (!user) {
            throw new Error("Please sign in to manage collections.");
          }

          if (mode === "edit" && !collection?.id) {
            throw new Error("Missing collection details.");
          }

          const token = await user.getIdToken();
          const response = await fetch(
            mode === "edit"
              ? `/api/collections/${collection?.id}`
              : "/api/collections",
            {
              method: mode === "edit" ? "PATCH" : "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payload),
            },
          );

          if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            console.error(
              mode === "edit"
                ? "Oops, we couldn't update that collection. Please try again."
                : "Oops, we couldn't create that collection. Please try again.",
              {
                status: response.status,
                error: errorBody,
              },
            );
            return;
          }

          const created = (await response.json()) as CreateCollectionResponse;
          if (mode === "edit") {
            console.info("collection-updated", created);
            onUpdate?.(created);
          } else {
            console.info("collection-created", created);
            onCreate?.(created);
          }
          handleRequestClose();
        } catch (error) {
          console.error(
            mode === "edit"
              ? "Failed to update collection."
              : "Failed to create collection.",
            error,
          );
        } finally {
          setIsSubmitting(false);
        }
      })();
    }, 700);
  };

  const handleDelete = async () => {
    if (!collection?.id || isDeleting) return;
    setIsDeleting(true);
    try {
      if (!user) {
        throw new Error("Please sign in to manage collections.");
      }
      const token = await user.getIdToken();
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        console.error("Oops, we couldn't delete that collection.", {
          status: response.status,
          error: errorBody,
        });
        showToast(
          "The collection couldn’t be deleted. Please try again.",
          "error",
        );
        return;
      }

      onDelete?.(collection.id);
      handleRequestClose();
    } catch (error) {
      console.error("Failed to delete collection.", error);
      showToast(
        "The collection couldn’t be deleted. Please try again.",
        "error",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <ModalLayout
      onClose={onClose}
      closeRef={closeRef}
      contentClassName="overflow-visible"
    >
      <div className="space-y-6">
        <h3 className="heading-4 text-base-content">
          {mode === "edit" ? "Edit collection" : "New collection"}
        </h3>

        <AuthField
          label="Name"
          required
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter a name"
        />

        <TextArea
          label="Description (optional)"
          value={description}
          onChange={(event) => {
            const nextValue = event.target.value.slice(
              0,
              DESCRIPTION_MAX_LENGTH,
            );
            setDescription(nextValue);
          }}
          placeholder="What’s this collection about?"
          rows={4}
          maxLength={DESCRIPTION_MAX_LENGTH}
          footerSlot={
            <span className={descriptionCounterClassName}>
              {descriptionCount} / {DESCRIPTION_MAX_LENGTH}
            </span>
          }
        />
      </div>

      <div className="modal-action mt-6 flex items-center justify-between">
        {mode === "edit" ? (
          <Popover className="relative">
            <PopoverButton
              type="button"
              className="btn btn-ghost btn-md body-16 text-error hover:text-error"
              disabled={isDeleting}
            >
              Delete
            </PopoverButton>
            <PopoverPanel className="absolute left-0 z-30 mt-2 w-64 rounded-xl border border-base-300 bg-base-100 p-4 shadow-lg">
              <p className="body-14 text-base-content/70">
                This action is permanent. All games will be removed from this
                collection.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-error btn-sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  Delete
                </button>
                <PopoverButton
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={isDeleting}
                >
                  Cancel
                </PopoverButton>
              </div>
            </PopoverPanel>
          </Popover>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <GhostButton size="md" type="button" onClick={handleRequestClose}>
            Cancel
          </GhostButton>
          <PrimaryButton
            size="md"
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {helperText}
          </PrimaryButton>
        </div>
      </div>
    </ModalLayout>
  );
}
