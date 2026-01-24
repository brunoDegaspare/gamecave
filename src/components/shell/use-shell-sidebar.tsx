"use client";

import * as React from "react";
import { screens } from "@root/types/tailwind-breakpoints";

export function useShellSidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const scrollLockPosition = React.useRef(0);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${screens.md}px)`);

    setCollapsed(!mediaQuery.matches);
    setIsMobile(!mediaQuery.matches);
    setIsHydrated(true);

    const handleChange = (event: MediaQueryListEvent) => {
      setCollapsed(!event.matches);
      setIsMobile(!event.matches);
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    const body = document.body;
    const html = document.documentElement;
    if (isMobile && !collapsed) {
      scrollLockPosition.current = window.scrollY || window.pageYOffset;
      body.style.position = "fixed";
      body.style.top = `-${scrollLockPosition.current}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
      html.style.overflow = "hidden";
    } else {
      const restoreY = scrollLockPosition.current;
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      html.style.overflow = "";
      if (restoreY) {
        window.scrollTo(0, restoreY);
      }
    }
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      html.style.overflow = "";
    };
  }, [collapsed, isHydrated, isMobile]);

  return { collapsed, setCollapsed, isHydrated, isMobile };
}
