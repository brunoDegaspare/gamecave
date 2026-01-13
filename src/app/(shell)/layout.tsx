import type { ReactNode } from "react";
import Shell from "@/components/layout/shell";
import AuthGate from "@/components/auth/auth-gate";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <Shell>{children}</Shell>
    </AuthGate>
  );
}
