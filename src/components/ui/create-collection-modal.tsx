"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
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
  mode?: CollectionModalMode;
  collection?: EditableCollection | null;
};

export default function CreateCollectionModal({
  open,
  onClose,
  onCreate,
  onUpdate,
  mode = "create",
  collection,
}: CreateCollectionModalProps) {
  const { user } = useAuth();
  const closeRef = useRef<(() => void) | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && collection) {
      setName(collection.name);
      setDescription(collection.description ?? "");
    } else {
      setName("");
      setDescription("");
    }
    setIsSubmitting(false);
  }, [collection, mode, open]);

  const trimmedName = name.trim();
  const canSubmit = Boolean(trimmedName) && !isSubmitting;
  const helperText = useMemo(
    () => {
      if (isSubmitting) {
        return mode === "edit" ? "Saving..." : "Creating...";
      }
      return mode === "edit" ? "Save changes" : "Create";
    },
    [isSubmitting, mode],
  );

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

  if (!open) return null;

  return (
    <ModalLayout onClose={onClose} closeRef={closeRef}>
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
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What’s this collection about?"
          rows={4}
        />
      </div>

      <div className="modal-action mt-6">
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
    </ModalLayout>
  );
}
