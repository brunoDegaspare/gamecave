"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MutableRefObject, ReactNode } from "react";

const FADE_DURATION_MS = 300;

type ModalLayoutProps = {
  children: ReactNode;
  onClose: () => void;
  dialogClassName?: string;
  contentClassName?: string;
  contentStyle?: CSSProperties;
  closeAriaLabel?: string;
  showCloseButton?: boolean;
  closeButtonClassName?: string;
  closeRef?: MutableRefObject<(() => void) | null>;
};

export default function ModalLayout({
  children,
  onClose,
  dialogClassName,
  contentClassName,
  contentStyle,
  closeAriaLabel = "Close",
  showCloseButton = true,
  closeButtonClassName,
  closeRef,
}: ModalLayoutProps) {
  const [isVisible, setIsVisible] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIsVisible(true);
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    if (!isVisible) return;
    setIsVisible(false);
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      onClose();
    }, FADE_DURATION_MS);
  };

  if (closeRef) {
    closeRef.current = handleClose;
  }

  return (
    <dialog
      className={clsx(
        "modal modal-open grid place-items-center transition-opacity duration-300 ease-out",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        dialogClassName,
      )}
      role="dialog"
      aria-modal="true"
      open
    >
      <div
        className={clsx(
          "modal-box w-full max-w-3xl bg-zinc-900 text-base-content transition-[opacity,transform] duration-300 ease-out",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]",
          contentClassName,
        )}
        style={contentStyle}
      >
        {showCloseButton && (
          <button
            type="button"
            className={clsx(
              "btn btn-sm btn-circle btn-ghost absolute right-4 top-4",
              closeButtonClassName,
            )}
            onClick={handleClose}
            aria-label={closeAriaLabel}
          >
            ✕
          </button>
        )}

        {children}
      </div>

      <form method="dialog" className="modal-backdrop" onClick={handleClose}>
        <button aria-label={closeAriaLabel}>close</button>
      </form>
    </dialog>
  );
}
