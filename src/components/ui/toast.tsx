"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import Icon from "@/components/ui/icon";

export type ToastVariant = "success" | "error" | "info" | "warning";

type ToastProps = {
  message: string;
  variant?: ToastVariant;
  onClose?: () => void;
  durationMs?: number;
  autoDismiss?: boolean;
  offset?: number;
};

const SLIDE_DURATION_MS = 300;

export default function Toast({
  message,
  variant = "success",
  onClose,
  durationMs = 3500,
  autoDismiss = true,
  offset = 0,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!autoDismiss) {
      return;
    }
    if (!isVisible) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsVisible(false);
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [autoDismiss, durationMs, isVisible]);

  useEffect(() => {
    if (isVisible) return;
    const timer = window.setTimeout(() => {
      onClose?.();
    }, SLIDE_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [isVisible, onClose]);

  const styleMap = {
    success: {
      icon: "ico-tick-circle-bold",
      accent: "text-success bg-success/15",
      wash: "bg-base-200 bg-gradient-to-br from-success/10 to-transparent",
      text: "text-success",
    },
    error: {
      icon: "ico-cross-circle-bold",
      accent: "text-error bg-error/15",
      wash: "bg-base-200 bg-gradient-to-br from-error/10 to-transparent",
      text: "text-error",
    },
    info: {
      icon: "ico-info-circle-bold",
      accent: "text-info bg-info/15",
      wash: "bg-base-200 bg-gradient-to-br from-info/10 to-transparent",
      text: "text-info",
    },
    warning: {
      icon: "ico-warning-bold",
      accent: "text-warning bg-warning/15",
      wash: "bg-base-200 bg-gradient-to-br from-warning/10 to-transparent",
      text: "text-warning",
    },
  } as const;

  const styles = styleMap[variant];

  return (
    <div className="pointer-events-none fixed inset-0 z-[1000] flex items-start justify-end p-4 sm:p-6">
      <div
        className={clsx(
          "pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 shadow-lg ring-1 ring-base-content/10 transition-transform duration-300",
          styles.wash,
          isVisible
            ? "translate-x-0 ease-out"
            : "translate-x-full ease-in",
        )}
        style={{ marginTop: offset }}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              "mt-0.5 flex h-8 w-8 items-center justify-center rounded-full",
              styles.accent,
            )}
          >
            <Icon name={styles.icon} size={24} className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className={clsx("body-16", styles.text)}>{message}</p>
          </div>
          {onClose ? (
            <button
              type="button"
              className="rounded-md p-1 text-base-content/50 transition hover:text-base-content cursor-pointer"
              onClick={() => setIsVisible(false)}
              aria-label="Dismiss notification"
            >
              <Icon name="ico-cross-outline" size={20} className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
