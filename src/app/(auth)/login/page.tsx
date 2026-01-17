"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import PrimaryButton from "@/components/ui/primary-button";
import Icon from "@/components/ui/icon";
import { signIn } from "@/lib/auth";
import { useAuth } from "@/components/auth/auth-provider";
import { validateEmail, validatePassword } from "@/lib/auth/validation";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isVisible, setIsVisible] = React.useState(false);
  const enterFrom: "left" | "right" = "right";
  const [exitDirection, setExitDirection] = React.useState<
    "left" | "right" | null
  >(null);
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
    []
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
      setError("Unable to sign in. Check your credentials and try again.");
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
    ? exitDirection === "left"
      ? "-translate-x-full"
      : "translate-x-full"
    : !isVisible
      ? enterFrom === "left"
        ? "-translate-x-full"
        : "translate-x-full"
      : "translate-x-0";

  return (
    <div
      className={clsx(
        "space-y-6 rounded-2xl border border-white/8 bg-[#0b0a12]/88 p-8 shadow-[0_0_32px_rgba(0,0,0,0.35)] backdrop-blur-[6px] transition-transform duration-300 ease-in-out",
        cardTranslateClass
      )}
    >
      <div className="space-y-2">
        <h1 className="heading-3 text-neutral-100">Login</h1>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <label className="block space-y-2">
          <div className="body-16 text-neutral-300">Email</div>
          <input
            type="email"
            required
            value={email}
            onChange={handleEmailChange}
            aria-invalid={hasSubmitted && Boolean(fieldErrors.email)}
            aria-describedby={
              hasSubmitted && fieldErrors.email ? emailErrorId : undefined
            }
            className={clsx(
              "w-full rounded-lg border bg-transparent px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:bg-neutral-900/70 focus:outline-none focus:ring-2 transition-all duration-300 ease-in-out placeholder:transition-opacity placeholder:duration-200 placeholder:ease-out",
              hasSubmitted && fieldErrors.email
                ? "border-red-400 focus:border-red-400 focus:ring-red-400 opacity-100"
                : "border-neutral-700 focus:border-purple-500 focus:ring-purple-500 enabled:opacity-90 enabled:focus:opacity-100 placeholder:opacity-60 focus:placeholder:opacity-40"
            )}
            placeholder="you@email.com"
          />
          {hasSubmitted && fieldErrors.email ? (
            <span
              id={emailErrorId}
              className="flex items-start gap-2 body-14 text-red-400"
              role="alert"
            >
              <Icon
                name="ico-cross-circle-outline"
                size={20}
                className="mt-0.5"
              />
              {fieldErrors.email}
            </span>
          ) : null}
        </label>

        <label className="block space-y-2">
          <div className="body-16 text-neutral-300">Password</div>
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
              "w-full rounded-lg border bg-transparent px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:bg-neutral-900/70 focus:outline-none focus:ring-2 transition-all duration-300 ease-in-out placeholder:transition-opacity placeholder:duration-200 placeholder:ease-out",
              hasSubmitted && fieldErrors.password
                ? "border-red-400 focus:border-red-400 focus:ring-red-400 opacity-100"
                : "border-neutral-700 focus:border-purple-500 focus:ring-purple-500 enabled:opacity-90 enabled:focus:opacity-100 placeholder:opacity-60 focus:placeholder:opacity-40"
            )}
            placeholder="••••••••"
          />
          {hasSubmitted && fieldErrors.password ? (
            <span
              id={passwordErrorId}
              className="flex items-start gap-2 body-14 text-red-400"
              role="alert"
            >
              <Icon
                name="ico-cross-circle-outline"
                size={20}
                className="mt-0.5"
              />
              {fieldErrors.password}
            </span>
          ) : null}
        </label>

        {error ? (
          <p className="body-14 text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <PrimaryButton size="md" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </PrimaryButton>
      </form>

      <p className="body-14 text-neutral-400">
        No account yet?{" "}
        <Link
          href="/signup"
          className="text-purple-300 hover:text-purple-200"
          onClick={handleAuthLinkClick("/signup")}
        >
          Create one
        </Link>
        .
      </p>
    </div>
  );
}
