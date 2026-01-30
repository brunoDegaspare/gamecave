"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import {
  ensureAuthPersistence,
  onAuthStateChangedListener,
  signOut,
} from "@/lib/auth";
import { firebaseAuth } from "@/lib/firebase/client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const hasHandledTokenExpiry = React.useRef(false);

  React.useEffect(() => {
    ensureAuthPersistence().catch(() => undefined);
    const unsubscribe = onAuthStateChangedListener((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (user) {
      hasHandledTokenExpiry.current = false;
    }
  }, [user]);

  const handleExpiredToken = React.useCallback(async () => {
    if (hasHandledTokenExpiry.current) return;
    hasHandledTokenExpiry.current = true;
    try {
      await signOut();
    } catch {
      // Ignore sign out failures to avoid blocking the redirect.
    } finally {
      setUser(null);
      setLoading(false);
      router.replace("/login");
    }
  }, [router]);

  const refreshUser = React.useCallback(async () => {
    if (!firebaseAuth.currentUser) {
      setUser(null);
      return;
    }

    try {
      await firebaseAuth.currentUser.reload();
      setUser(firebaseAuth.currentUser);
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? String((error as { code: unknown }).code)
          : null;
      if (code === "auth/user-token-expired") {
        void handleExpiredToken();
        return;
      }
      console.error("Failed to refresh auth user.", error);
    }
  }, [handleExpiredToken]);

  React.useEffect(() => {
    const handleFocus = () => refreshUser();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshUser();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
