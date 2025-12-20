"use client";

import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";

type ModalLayoutProps = {
  children: ReactNode;
  onClose: () => void;
  dialogClassName?: string;
  contentClassName?: string;
  contentStyle?: CSSProperties;
  closeAriaLabel?: string;
  showCloseButton?: boolean;
  closeButtonClassName?: string;
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
}: ModalLayoutProps) {
  return (
    <dialog
      className={clsx("modal modal-open grid place-items-center", dialogClassName)}
      role="dialog"
      aria-modal="true"
      open
    >
      <div
        className={clsx(
          "modal-box w-full max-w-3xl bg-base-100 text-base-content",
          contentClassName
        )}
        style={contentStyle}
      >
        {showCloseButton && (
          <button
            type="button"
            className={clsx(
              "btn btn-sm btn-circle btn-ghost absolute right-4 top-4",
              closeButtonClassName
            )}
            onClick={onClose}
            aria-label={closeAriaLabel}
          >
            ✕
          </button>
        )}

        {children}
      </div>

      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button aria-label={closeAriaLabel}>close</button>
      </form>
    </dialog>
  );
}
