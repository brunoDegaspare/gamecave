"use client";

import * as React from "react";
import type { User } from "firebase/auth";
import {
  ensureAuthPersistence,
  onAuthStateChangedListener,
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

  React.useEffect(() => {
    ensureAuthPersistence().catch(() => undefined);
    const unsubscribe = onAuthStateChangedListener((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshUser = React.useCallback(async () => {
    if (!firebaseAuth.currentUser) {
      setUser(null);
      return;
    }

    try {
      await firebaseAuth.currentUser.reload();
      setUser(firebaseAuth.currentUser);
    } catch (error) {
      console.error("Failed to refresh auth user.", error);
    }
  }, []);

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
