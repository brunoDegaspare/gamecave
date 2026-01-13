"use client";

import * as React from "react";
import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "@/components/auth/auth-provider";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HeroUIProvider>
      <AuthProvider>{children}</AuthProvider>
    </HeroUIProvider>
  );
}
