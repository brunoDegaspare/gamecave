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
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState({
    email: "",
    password: "",
  });
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [suppressAutoRedirect, setSuppressAutoRedirect] = React.useState(false);
  const redirectTimeoutRef = React.useRef<number | null>(null);

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
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = {
      email: validateEmail(email, SIGNUP_REQUIRED_MESSAGES.email),
      password: validatePassword(password, SIGNUP_REQUIRED_MESSAGES.password),
    };
    setFieldErrors(nextErrors);
    setHasSubmitted(true);
    if (nextErrors.email || nextErrors.password) {
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
    if (hasSubmitted) {
      setFieldErrors((prev) => ({
        ...prev,
        email: validateEmail(nextValue, SIGNUP_REQUIRED_MESSAGES.email),
      }));
    }
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setPassword(nextValue);
    if (hasSubmitted) {
      setFieldErrors((prev) => ({
        ...prev,
        password: validatePassword(
          nextValue,
          SIGNUP_REQUIRED_MESSAGES.password
        ),
      }));
    }
  };

  const emailErrorId = "signup-email-error";
  const passwordErrorId = "signup-password-error";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="heading-3 text-white">Create your account</h1>
        <p className="body-16 text-neutral-400">
          Start tracking your collection with GameCave.
        </p>
      </div>

      <form className="relative space-y-4" onSubmit={handleSubmit} noValidate>
        <fieldset disabled={loading} className="space-y-4">
          <label className="block space-y-2">
            <span className="body-14 text-neutral-300">Email</span>
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
                "w-full rounded-lg border bg-neutral-900 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2",
                hasSubmitted && fieldErrors.email
                  ? "border-red-400 focus:ring-red-400"
                  : "border-neutral-800 focus:ring-purple-500"
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
            <span className="body-14 text-neutral-300">Password</span>
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
                "w-full rounded-lg border bg-neutral-900 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2",
                hasSubmitted && fieldErrors.password
                  ? "border-red-400 focus:ring-red-400"
                  : "border-neutral-800 focus:ring-purple-500"
              )}
              placeholder="Create a password"
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
            <Alert variant="error" icon="ico-cross-circle-outline">
              <span>{error}</span>
            </Alert>
          ) : null}

          <PrimaryButton size="md" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <span
                  className="loading loading-spinner loading-sm"
                  aria-hidden
                />
                Loading...
              </>
            ) : (
              "Create account"
            )}
          </PrimaryButton>
        </fieldset>

        {loading ? (
          <div
            className="absolute inset-0 z-10 rounded-lg bg-neutral-950/60 backdrop-blur-[1px]"
            aria-hidden="true"
          />
        ) : null}
      </form>

      <p className="body-14 text-neutral-400">
        Already have an account?{" "}
        <Link href="/login" className="text-purple-300 hover:text-purple-200">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}
