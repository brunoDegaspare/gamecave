"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import PrimaryButton from "@/components/ui/primary-button";
import Icon from "@/components/ui/icon";
import AuthField from "@/components/auth/auth-field";
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
        "space-y-6 rounded-2xl border border-white/8 bg-[#0b0a12]/88 p-8 shadow-[0_0_32px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-in-out",
        cardTranslateClass,
      )}
    >
      <div className="space-y-2">
        <h1 className="heading-3 text-neutral-100">Welcome back</h1>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <AuthField
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

        <label className="block space-y-2 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="body-16 text-neutral-300">Password</div>
            <Link
              href="/forgot-password"
              className="body-16 link-accent"
              onClick={handleAuthLinkClick("/forgot-password")}
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={handlePasswordChange}
            aria-invalid={hasSubmitted && Boolean(fieldErrors.password)}
            aria-describedby={
              hasSubmitted && fieldErrors.password ? passwordErrorId : undefined
            }
            className={clsx(
              "w-full rounded-lg border px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:bg-neutral-900/70 focus:outline-none focus:ring-2 transition-all duration-300 ease-in-out placeholder:transition-opacity placeholder:duration-200 placeholder:ease-out",
              password ? "bg-neutral-800" : "bg-transparent",
              hasSubmitted && fieldErrors.password
                ? "border-red-400 focus:border-red-400 focus:ring-red-400 opacity-100"
                : "border-neutral-700 focus:border-purple-500 focus:ring-purple-500 enabled:opacity-90 enabled:focus:opacity-100 placeholder:opacity-60 focus:placeholder:opacity-40",
            )}
            placeholder="••••••••"
          />
          {hasSubmitted && fieldErrors.password ? (
            <span
              id={passwordErrorId}
              className="flex items-center gap-2 body-14 text-red-400"
              role="alert"
            >
              <Icon
                name="ico-cross-circle-outline"
                size={24}
                className="mt-0.5 h-6 w-6 shrink-0"
              />
              {fieldErrors.password}
            </span>
          ) : null}
        </label>

        {error ? (
          <span
            className="flex items-center gap-2 body-14 text-red-400"
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

      <p className="body-16 text-muted">
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
