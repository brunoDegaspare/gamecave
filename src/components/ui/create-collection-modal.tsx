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
        <h3 className="heading-4 text-base-content">New collection</h3>

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
          onClick={handleCreate}
        >
          {helperText}
        </PrimaryButton>
      </div>
    </ModalLayout>
  );
}
