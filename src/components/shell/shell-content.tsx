"use client";

import * as React from "react";
import Lenis from "lenis";
import type { User } from "firebase/auth";
import Alert from "@/components/ui/alert";
import ShellHeader from "@/components/shell/shell-header";

type ShellContentProps = {
  children: React.ReactNode;
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
  const contentWrapperRef = React.useRef<HTMLElement | null>(null);
  const contentInnerRef = React.useRef<HTMLDivElement | null>(null);
  const lenisRef = React.useRef<Lenis | null>(null);
  const rafIdRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!contentWrapperRef.current || !contentInnerRef.current) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    if (!window.matchMedia("(min-width: 768px)").matches) {
      return;
    }

    const lenis = new Lenis({
      wrapper: contentWrapperRef.current,
      content: contentInnerRef.current,
      duration: 1.05,
      smoothWheel: true,
      smoothTouch: false,
    });

    lenisRef.current = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      rafIdRef.current = requestAnimationFrame(raf);
    };

    rafIdRef.current = requestAnimationFrame(raf);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

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

      <main
        ref={contentWrapperRef}
        className="flex-1 min-h-0 overflow-visible md:overflow-y-auto gc-scrollbar"
      >
        <div ref={contentInnerRef}>{children}</div>
      </main>
    </div>
  );
}
