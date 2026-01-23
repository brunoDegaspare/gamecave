"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import AuthField from "@/components/auth/auth-field";
import GhostButton from "@/components/ui/ghost-button";
import ModalLayout from "@/components/ui/modal-layout";
import PrimaryButton from "@/components/ui/primary-button";

type CreateCollectionResponse = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
};

type CreateCollectionModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate?: (collection: CreateCollectionResponse) => void;
};

export default function CreateCollectionModal({
  open,
  onClose,
  onCreate,
}: CreateCollectionModalProps) {
  const { user } = useAuth();
  const closeRef = useRef<(() => void) | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
    setIsSubmitting(false);
  }, [open]);

  const trimmedName = name.trim();
  const canSubmit = Boolean(trimmedName) && !isSubmitting;
  const helperText = useMemo(
    () => (isSubmitting ? "Creating..." : "Create"),
    [isSubmitting],
  );

  const handleRequestClose = () => {
    if (closeRef.current) {
      closeRef.current();
      return;
    }
    onClose();
  };

  const handleCreate = () => {
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
            throw new Error("Please sign in to create a collection.");
          }

          const token = await user.getIdToken();
          const response = await fetch("/api/collections", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            console.error(
              "Oops, we couldn't create that collection. Please try again.",
              {
                status: response.status,
                error: errorBody,
              },
            );
            return;
          }

          const created = (await response.json()) as CreateCollectionResponse;
          console.info("collection-created", created);
          onCreate?.(created);
          handleRequestClose();
        } catch (error) {
          console.error("Failed to create collection.", error);
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
        <h3 className="heading-4 text-white">New collection</h3>

        <AuthField
          label="Name"
          required
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter a name"
        />

        <label className="block space-y-2">
          <div className="body-16 text-neutral-300">Description (optional)</div>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What’s this collection about?"
            rows={4}
            className="gc-placeholder w-full min-h-[120px] rounded-lg border border-neutral-700 bg-transparent px-3 py-2 text-neutral-300 placeholder-neutral-500 focus:bg-neutral-900/70 focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-500 transition-all duration-300 ease-in-out placeholder:transition-opacity placeholder:duration-200 placeholder:ease-out"
          />
        </label>
      </div>

      <div className="modal-action mt-6">
        <GhostButton size="md" type="button" onClick={handleRequestClose}>
          Cancel
        </GhostButton>
        <PrimaryButton
          size="md"
          type="button"
          disabled={!canSubmit}
          onClick={handleCreate}
        >
          {helperText}
        </PrimaryButton>
      </div>
    </ModalLayout>
  );
}
