"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { sendPasswordResetEmail } from "firebase/auth";
import PrimaryButton from "@/components/ui/primary-button";
import TextInput from "@/components/ui/text-input";
import { firebaseAuth } from "@/lib/firebase/client";

type Direction = "left" | "right";

const translateByDirection: Record<Direction, string> = {
  left: "-translate-x-full",
  right: "translate-x-full",
};

const ERROR_MESSAGES = {
  userNotFound: "We couldn’t find an account with this email.",
  invalidEmail: "Please enter a valid email address.",
  generic: "Please enter your email.",
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
  const emailErrorId = "forgot-password-email-error";
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
        "space-y-6 rounded-2xl border border-base-content/10 bg-base-200/80 p-8 shadow-[0_0_32px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-in-out",
        cardTranslateClass,
      )}
    >
      {hasSent ? (
        <>
          <div className="space-y-2">
            <h1 className="heading-3 text-base-content">Check your email</h1>
            <p className="body-16 text-base-content/70">
              If an account exists for this email address, you’ll receive a
              password reset link shortly. Follow the instructions in the email
              to regain access to your GameCave account.
            </p>
          </div>
          <p className="body-16">
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
            <h1 className="heading-3 text-base-content">Reset your password</h1>
            <p className="body-16 text-base-content/70">
              Forgot your password? No worries. Enter your email below and we’ll
              send you a link to reset it.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <TextInput
              label="Email"
              type="email"
              required
              value={email}
              onChange={handleEmailChange}
              placeholder="you@email.com"
              error={error}
              showError={Boolean(error)}
              errorId={emailErrorId}
            />

            <PrimaryButton size="lg" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </PrimaryButton>
          </form>

          <p className="body-16">
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
