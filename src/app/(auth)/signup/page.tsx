"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import PrimaryButton from "@/components/ui/primary-button";
import Alert from "@/components/ui/alert";
import Icon from "@/components/ui/icon";
import { sendVerificationEmail, signUp } from "@/lib/auth";
import { useAuth } from "@/components/auth/auth-provider";
import { validateEmail, validatePassword } from "@/lib/auth/validation";

type Direction = "left" | "right";

const SIGNUP_MESSAGES = {
  verificationFallback:
    "Account created, but we couldn’t send the verification email. Please try again later.",
  fallback: "Oops! We're unable to create your account. Please try again.",
  errors: {
    "auth/email-already-in-use": "Oops! This email is already registered.",
    "auth/invalid-email":
      "Please enter a valid email address. Emails must follow the format name@example.com.",
    "auth/weak-password": "Password must be at least 6 characters.",
  },
};
const SIGNUP_REQUIRED_MESSAGES = {
  email: "Please enter your email",
  password: "Please create a password",
  repeatPassword: "Please repeat your password",
};

const REDIRECT_DELAY_MS = 3000;

const getSignupErrorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: string }).code;
    if (code && code in SIGNUP_MESSAGES.errors) {
      return SIGNUP_MESSAGES.errors[
        code as keyof typeof SIGNUP_MESSAGES.errors
      ];
    }
  }

  return SIGNUP_MESSAGES.fallback;
};

export default function SignupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [repeatPassword, setRepeatPassword] = React.useState("");
  const [isVisible, setIsVisible] = React.useState(false);
  const enterFrom: Direction = "right";
  const [exitDirection, setExitDirection] = React.useState<Direction | null>(
    null,
  );
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState({
    email: "",
    password: "",
    repeatPassword: "",
  });
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [suppressAutoRedirect, setSuppressAutoRedirect] = React.useState(false);
  const redirectTimeoutRef = React.useRef<number | null>(null);
  const transitionTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (user && !suppressAutoRedirect) {
      router.replace("/");
    }
  }, [router, suppressAutoRedirect, user]);

  React.useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = {
      email: validateEmail(email, SIGNUP_REQUIRED_MESSAGES.email),
      password: validatePassword(password, SIGNUP_REQUIRED_MESSAGES.password),
      repeatPassword: repeatPassword
        ? password !== repeatPassword
          ? "Passwords do not match."
          : ""
        : SIGNUP_REQUIRED_MESSAGES.repeatPassword,
    };
    setFieldErrors(nextErrors);
    setHasSubmitted(true);
    if (nextErrors.email || nextErrors.password || nextErrors.repeatPassword) {
      return;
    }

    setSuppressAutoRedirect(true);
    setError("");
    setLoading(true);

    let didSucceed = false;
    try {
      await signUp(email, password);
      didSucceed = true;
      try {
        await sendVerificationEmail();
      } catch (verificationError) {
        console.error("Failed to send verification email.", verificationError);
        setError(SIGNUP_MESSAGES.verificationFallback);
      }

      redirectTimeoutRef.current = window.setTimeout(() => {
        router.replace("/");
      }, REDIRECT_DELAY_MS);
    } catch (err) {
      setError(getSignupErrorMessage(err));
      setSuppressAutoRedirect(false);
    } finally {
      if (!didSucceed) {
        setLoading(false);
      }
    }
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setEmail(nextValue);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setPassword(nextValue);
  };

  const handleRepeatPasswordChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextValue = event.target.value;
    setRepeatPassword(nextValue);
  };

  const emailErrorId = "signup-email-error";
  const passwordErrorId = "signup-password-error";
  const repeatPasswordErrorId = "signup-repeat-password-error";
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
        "space-y-6 rounded-2xl border border-white/8 bg-[#0b0a12]/88 p-8 shadow-[0_0_32px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-in-out",
        cardTranslateClass,
      )}
    >
      <div className="space-y-3">
        <h1 className="heading-3 text-strong">Create your account</h1>
      </div>

      <form className="relative space-y-4" onSubmit={handleSubmit} noValidate>
        <fieldset disabled={loading}>
          <label className="block space-y-2 mb-6">
            <div className="body-16 text-neutral-300">Email address</div>
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
                "w-full rounded-lg border px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:bg-neutral-900/70 focus:outline-none focus:ring-2 transition-all duration-300 ease-in-out placeholder:transition-opacity placeholder:duration-200 placeholder:ease-out",
                email ? "bg-neutral-800/40" : "bg-transparent",
                hasSubmitted && fieldErrors.email
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400 opacity-100"
                  : "border-neutral-700 focus:border-purple-500 focus:ring-purple-500 enabled:opacity-90 enabled:focus:opacity-100 placeholder:opacity-60 focus:placeholder:opacity-40",
              )}
              placeholder="you@email.com"
            />
            {hasSubmitted && fieldErrors.email ? (
              <span
                id={emailErrorId}
                className="flex items-center gap-2 body-14 text-red-400"
                role="alert"
              >
                <Icon
                  name="ico-cross-circle-outline"
                  size={24}
                  className="mt-0.5 h-6 w-6 shrink-0"
                />
                {fieldErrors.email}
              </span>
            ) : null}
          </label>

          <label className="block space-y-2 mb-6">
            <div className="body-16 text-neutral-300">Password</div>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={handlePasswordChange}
              aria-invalid={hasSubmitted && Boolean(fieldErrors.password)}
              aria-describedby={
                hasSubmitted && fieldErrors.password
                  ? passwordErrorId
                  : undefined
              }
              className={clsx(
                "w-full rounded-lg border px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:bg-neutral-900/70 focus:outline-none focus:ring-2 transition-all duration-300 ease-in-out placeholder:transition-opacity placeholder:duration-200 placeholder:ease-out",
                password ? "bg-neutral-800" : "bg-transparent",
                hasSubmitted && fieldErrors.password
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400 opacity-100"
                  : "border-neutral-700 focus:border-purple-500 focus:ring-purple-500 enabled:opacity-90 enabled:focus:opacity-100 placeholder:opacity-60 focus:placeholder:opacity-40",
              )}
              placeholder="Create a password"
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

          <label className="block space-y-2 mb-6">
            <div className="body-16 text-neutral-300">Repeat password</div>
            <input
              type="password"
              required
              minLength={6}
              value={repeatPassword}
              onChange={handleRepeatPasswordChange}
              aria-invalid={hasSubmitted && Boolean(fieldErrors.repeatPassword)}
              aria-describedby={
                hasSubmitted && fieldErrors.repeatPassword
                  ? repeatPasswordErrorId
                  : undefined
              }
              className={clsx(
                "w-full rounded-lg border px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:bg-neutral-900/70 focus:outline-none focus:ring-2 transition-all duration-300 ease-in-out placeholder:transition-opacity placeholder:duration-200 placeholder:ease-out",
                repeatPassword ? "bg-neutral-800" : "bg-transparent",
                hasSubmitted && fieldErrors.repeatPassword
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400 opacity-100"
                  : "border-neutral-700 focus:border-purple-500 focus:ring-purple-500 enabled:opacity-90 enabled:focus:opacity-100 placeholder:opacity-60 focus:placeholder:opacity-40",
              )}
              placeholder="Re-enter your password"
            />
            {hasSubmitted && fieldErrors.repeatPassword ? (
              <span
                id={repeatPasswordErrorId}
                className="flex items-center gap-2 body-14 text-red-400"
                role="alert"
              >
                <Icon
                  name="ico-cross-circle-outline"
                  size={24}
                  className="mt-0.5 h-6 w-6 shrink-0"
                />
                {fieldErrors.repeatPassword}
              </span>
            ) : null}
          </label>

          {error ? (
            <Alert variant="error" icon="ico-cross-circle-outline">
              <span>{error}</span>
            </Alert>
          ) : null}

          <PrimaryButton size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <span
                  className="loading loading-spinner loading-sm"
                  aria-hidden
                />
                Creating your account...
              </>
            ) : (
              "Create account"
            )}
          </PrimaryButton>
        </fieldset>

        {loading ? (
          <div
            className="absolute inset-0 z-10 rounded-lg bg-neutral-950/60"
            aria-hidden="true"
          />
        ) : null}
      </form>

      <p className="body-16 text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="link-accent"
          onClick={handleAuthLinkClick("/login")}
        >
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}
