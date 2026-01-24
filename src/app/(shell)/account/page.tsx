"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import PrimaryButton from "@/components/ui/primary-button";
import GhostButton from "@/components/ui/ghost-button";
import { useAuth } from "@/components/auth/auth-provider";
import { deleteAccount, signOut } from "@/lib/auth";

export default function AccountPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = React.useState("");
  const [signingOut, setSigningOut] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const handleSignOut = async () => {
    setError("");
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/login");
    } catch (err) {
      setError("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your account? This cannot be undone.")) {
      return;
    }

    setError("");
    setDeleting(true);
    try {
      await deleteAccount();
      router.replace("/signup");
    } catch (err) {
      setError(
        "For security reasons, we need you to sign in again before deleting your account."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="space-y-2">
        <h1 className="heading-4 text-base-content">Account</h1>
        <p className="body-16 text-base-content/60">
          Signed in as {user?.email ?? "unknown user"}.
        </p>
      </div>

      {error ? (
        <p className="body-14 text-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <PrimaryButton
          size="md"
          className="w-full sm:w-auto"
          onClick={handleSignOut}
          disabled={signingOut || deleting}
        >
          {signingOut ? "Signing out..." : "Sign out"}
        </PrimaryButton>
        <GhostButton
          size="md"
          className="w-full border border-error/40 text-error hover:bg-error/10 sm:w-auto"
          onClick={handleDeleteAccount}
          disabled={signingOut || deleting}
        >
          {deleting ? "Deleting..." : "Delete account"}
        </GhostButton>
      </div>
    </div>
  );
}
