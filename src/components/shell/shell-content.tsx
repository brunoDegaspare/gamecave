"use client";

import type { ReactNode } from "react";
import type { User } from "firebase/auth";
import Alert from "@/components/ui/alert";
import ShellHeader from "@/components/shell/shell-header";

type ShellContentProps = {
  children: ReactNode;
  user: User | null;
  collapsed: boolean;
  isHydrated: boolean;
  onToggleSidebar: () => void;
};

export default function ShellContent({
  children,
  user,
  collapsed,
  isHydrated,
  onToggleSidebar,
}: ShellContentProps) {
  return (
    <div className="drawer-content flex flex-1 flex-col min-h-0 min-w-0 md:order-2 md:overflow-x-hidden transition-all duration-300 ease-in-out">
      <ShellHeader
        collapsed={collapsed}
        isHydrated={isHydrated}
        onToggleSidebar={onToggleSidebar}
      />

      {user && !user.emailVerified ? (
        <div className="px-6 pt-4">
          <Alert variant="warning" icon="ico-warning-outline">
            <span>Please verify your email to unlock all features.</span>
          </Alert>
        </div>
      ) : null}

      <main className="flex-1 min-h-0 overflow-visible md:overflow-y-auto gc-scrollbar">
        {children}
      </main>
    </div>
  );
}
