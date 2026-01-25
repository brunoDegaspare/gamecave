"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import PrimaryButton from "@/components/ui/primary-button";
import Icon from "@/components/ui/icon";
import TextInput from "@/components/ui/text-input";
import { signIn } from "@/lib/auth";
import { useAuth } from "@/components/auth/auth-provider";
import { validateEmail, validatePassword } from "@/lib/auth/validation";

type Direction = "left" | "right";

const translateByDirection: Record<Direction, string> = {
  left: "-translate-x-full",
  right: "translate-x-full",
};

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isVisible, setIsVisible] = React.useState(false);
  const enterFrom: Direction = "right";
  const [exitDirection, setExitDirection] = React.useState<Direction | null>(
    null,
  );
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState({
    email: "",
    password: "",
  });
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const transitionTimeoutRef = React.useRef<number | null>(null);
  const requiredMessages = React.useMemo(
    () => ({
      email: "Please enter your email",
      password: "Please enter your password",
    }),
    [],
  );

  React.useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [router, user]);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = {
      email: validateEmail(email, requiredMessages.email),
      password: validatePassword(password, requiredMessages.password),
    };
    setFieldErrors(nextErrors);
    setHasSubmitted(true);
    if (nextErrors.email || nextErrors.password) {
      return;
    }

    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace("/");
    } catch (err) {
      setError(
        "Ops! Something didn’t match. Check your email and password and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setEmail(nextValue);
    if (hasSubmitted) {
      setFieldErrors((prev) => ({
        ...prev,
        email: validateEmail(nextValue, requiredMessages.email),
      }));
    }
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setPassword(nextValue);
    if (hasSubmitted) {
      setFieldErrors((prev) => ({
        ...prev,
        password: validatePassword(nextValue, requiredMessages.password),
      }));
    }
  };

  const emailErrorId = "login-email-error";
  const passwordErrorId = "login-password-error";
  const transitionDurationMs = 300;

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
        "space-y-6 rounded-2xl border border-base-content/10 bg-base-200 p-8 shadow-[0_0_32px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-in-out",
        cardTranslateClass,
      )}
    >
      <div className="space-y-2">
        <h1 className="heading-3 text-base-content">Welcome back</h1>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <TextInput
          label="Email"
          type="email"
          required
          value={email}
          onChange={handleEmailChange}
          placeholder="you@email.com"
          error={fieldErrors.email}
          showError={hasSubmitted}
          errorId={emailErrorId}
        />

        <TextInput
          label="Password"
          type="password"
          required
          value={password}
          onChange={handlePasswordChange}
          placeholder="••••••••"
          error={fieldErrors.password}
          showError={hasSubmitted}
          errorId={passwordErrorId}
          rightSlot={
            <Link
              href="/forgot-password"
              className="body-16 link-accent"
              onClick={handleAuthLinkClick("/forgot-password")}
            >
              Forgot password?
            </Link>
          }
        />

        {error ? (
          <span
            className="flex items-center gap-2 body-14 text-error"
            role="alert"
          >
            <Icon
              name="ico-cross-circle-outline"
              size={24}
              className="mt-0.5 h-6 w-6 shrink-0"
            />
            {error}
          </span>
        ) : null}

        <PrimaryButton size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing you in..." : "Login"}
        </PrimaryButton>
      </form>

      <p className="body-16">
        No account yet?{" "}
        <Link
          href="/signup"
          className="link-accent"
          onClick={handleAuthLinkClick("/signup")}
        >
          Create one
        </Link>
        .
      </p>
    </div>
  );
}
