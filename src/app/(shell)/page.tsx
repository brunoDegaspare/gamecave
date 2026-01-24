"use client";

import * as React from "react";
import HomeHighlights from "@/components/home/home-highlights";
import CollectionCard from "@/components/ui/collection-card";
import PrimaryButton from "@/components/ui/primary-button";
import { useAuth } from "@/components/auth/auth-provider";

const RECENT_COLLECTIONS = [
  {
    id: "snes",
    title: "SNES Classics",
    gamesCount: 18,
    lastGameCover: "/covers/super-metroid.jpg",
  },
  {
    id: "md",
    title: "Mega Drive",
    gamesCount: 12,
    lastGameCover: "/covers/sonic-2-md.jpg",
  },
  {
    id: "ms",
    title: "Master System",
    gamesCount: 9,
    lastGameCover: "/covers/alex-kidd.jpg",
  },
  {
    id: "psx",
    title: "PlayStation",
    gamesCount: 15,
    lastGameCover: "/covers/mega-man-x.jpg",
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const [showVerificationModal, setShowVerificationModal] =
    React.useState(false);
  const dialogRef = React.useRef<HTMLDialogElement | null>(null);

  React.useEffect(() => {
    if (!user || user.emailVerified) {
      return;
    }

    const storageKey = `emailVerificationModalSeen:${user.uid}`;
    if (window.localStorage.getItem(storageKey) === "true") {
      return;
    }

    window.localStorage.setItem(storageKey, "true");
    setShowVerificationModal(true);
  }, [user]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (showVerificationModal && !dialog.open) {
      dialog.showModal();
    }
  }, [showVerificationModal]);

  const handleDismissModal = () => {
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
  };

  const userEmail =
    user?.email ??
    user?.providerData?.find((provider) => provider?.email)?.email ??
    "email";

  return (
    <div className="flex flex-col gap-12 p-6 max-w-[1440px] mx-auto">
      <dialog
        ref={dialogRef}
        className="modal modal-bottom sm:modal-middle"
        onClose={() => setShowVerificationModal(false)}
        onCancel={handleDismissModal}
      >
        <div className="modal-box bg-base-100 text-base-content">
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            onClick={handleDismissModal}
            aria-label="Close"
          >
            ✕
          </button>
          <h3 className="heading-4 text-base-content">Verify your email</h3>
          <p className="body-16 text-base-content/70 mt-3">
            We’ve sent a verification link to your{" "}
            <span className="text-base-content weight-medium">{userEmail}</span>
            . Check your inbox (and your spam folder just in case) to confirm it
            and start creating your collections.
          </p>
          <div className="modal-action">
            <PrimaryButton size="md" onClick={handleDismissModal}>
              Ok, thank you
            </PrimaryButton>
          </div>
        </div>
        <form
          method="dialog"
          className="modal-backdrop"
          onClick={handleDismissModal}
        >
          <button aria-label="Close verification modal">close</button>
        </form>
      </dialog>

      <HomeHighlights />

      <section className="w-full max-w-full overflow-hidden">
        <div className="mb-4 flex items-center justify-between px-1">
          <h2 className="heading-5 text-base-content">Your collections</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {RECENT_COLLECTIONS.map((collection) => (
            <CollectionCard key={collection.id} {...collection} />
          ))}
        </div>
      </section>
    </div>
  );
}
