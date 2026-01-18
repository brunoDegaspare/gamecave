"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { sendPasswordResetEmail } from "firebase/auth";
import PrimaryButton from "@/components/ui/primary-button";
import { firebaseAuth } from "@/lib/firebase/client";

type Direction = "left" | "right";

const translateByDirection: Record<Direction, string> = {
  left: "-translate-x-full",
  right: "translate-x-full",
};

const ERROR_MESSAGES = {
  userNotFound: "We couldn’t find an account with this email.",
  invalidEmail: "Please enter a valid email address.",
  generic: "Something went wrong. Please try again in a moment.",
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [isVisible, setIsVisible] = React.useState(false);
  const enterFrom: Direction = "right";
  const [exitDirection, setExitDirection] = React.useState<Direction | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [hasSent, setHasSent] = React.useState(false);
  const transitionTimeoutRef = React.useRef<number | null>(null);
  const transitionDurationMs = 300;

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      setHasSent(true);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "auth/user-not-found") {
        setError(ERROR_MESSAGES.userNotFound);
      } else if (code === "auth/invalid-email") {
        setError(ERROR_MESSAGES.invalidEmail);
      } else {
        setError(ERROR_MESSAGES.generic);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthLinkClick =
    (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey
      ) {
        return;
      }

      event.preventDefault();
      setExitDirection("right");
      transitionTimeoutRef.current = window.setTimeout(() => {
        router.push(href);
      }, transitionDurationMs);
    };

  const cardTranslateClass = exitDirection
    ? translateByDirection[exitDirection]
    : !isVisible
      ? translateByDirection[enterFrom]
      : "translate-x-0";

  return (
    <div
      className={clsx(
        "space-y-6 rounded-2xl border border-white/8 bg-[#0b0a12]/88 p-8 shadow-[0_0_32px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-in-out",
        cardTranslateClass,
      )}
    >
      {hasSent ? (
        <>
          <div className="space-y-2">
            <h1 className="heading-3 text-neutral-100">Check your email</h1>
            <p className="body-16 text-neutral-300">
              We’ve sent a password reset link to your email. Follow the
              instructions in the email to regain access to your GameCave.
            </p>
          </div>
          <p className="body-16 text-muted">
            <Link
              href="/login"
              className="link-accent"
              onClick={handleAuthLinkClick("/login")}
            >
              Back to login
            </Link>
          </p>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <h1 className="heading-3 text-neutral-100">Reset your password</h1>
            <p className="body-16 text-neutral-300">
              Forgot your password? No worries. Enter your email below and we’ll
              send you a link to reset it.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <label className="block space-y-2 mb-6">
              <div className="body-16 text-neutral-300">Email</div>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                className={clsx(
                  "w-full rounded-lg border px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:bg-neutral-900/70 focus:outline-none focus:ring-2 transition-all duration-300 ease-in-out placeholder:transition-opacity placeholder:duration-200 placeholder:ease-out",
                  email ? "bg-neutral-800" : "bg-transparent",
                  error
                    ? "border-red-400 focus:border-red-400 focus:ring-red-400 opacity-100"
                    : "border-neutral-700 focus:border-purple-500 focus:ring-purple-500 enabled:opacity-90 enabled:focus:opacity-100 placeholder:opacity-60 focus:placeholder:opacity-40",
                )}
                placeholder="you@email.com"
              />
            </label>

            {error ? (
              <p className="body-14 text-red-400" role="alert">
                {error}
              </p>
            ) : null}

            <PrimaryButton size="lg" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </PrimaryButton>
          </form>

          <p className="body-16 text-muted">
            <Link
              href="/login"
              className="link-accent"
              onClick={handleAuthLinkClick("/login")}
            >
              Back to login
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
