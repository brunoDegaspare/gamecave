import type { InputHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import Icon from "@/components/ui/icon";

type AuthFieldProps = {
  label: string;
  error?: string;
  errorId?: string;
  showError?: boolean;
  rightSlot?: ReactNode;
  containerClassName?: string;
  inputClassName?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

export default function AuthField({
  label,
  error,
  errorId,
  showError,
  rightSlot,
  containerClassName,
  inputClassName,
  value,
  ...inputProps
}: AuthFieldProps) {
  const shouldShowError =
    Boolean(error) && (typeof showError === "boolean" ? showError : true);
  const hasValue = Array.isArray(value)
    ? value.length > 0
    : typeof value === "number"
      ? true
      : Boolean(value);

  return (
    <label className={clsx("block space-y-2 mb-6", containerClassName)}>
      {rightSlot ? (
        <div className="flex items-center justify-between gap-4">
          <span className="body-16 text-neutral-300">{label}</span>
          {rightSlot}
        </div>
      ) : (
        <div className="body-16 text-neutral-300">{label}</div>
      )}
      <input
        {...inputProps}
        value={value}
        aria-invalid={shouldShowError}
        aria-describedby={shouldShowError && errorId ? errorId : undefined}
        className={clsx(
          "w-full rounded-lg border px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:bg-neutral-900/70 focus:outline-none focus:ring-2 transition-all duration-300 ease-in-out placeholder:transition-opacity placeholder:duration-200 placeholder:ease-out",
          hasValue ? "bg-neutral-800" : "bg-transparent",
          shouldShowError
            ? "border-red-400 focus:border-red-400 focus:ring-red-400 opacity-100"
            : "border-neutral-700 focus:border-purple-500 focus:ring-purple-500 enabled:opacity-90 enabled:focus:opacity-100 placeholder:opacity-60 focus:placeholder:opacity-40",
          inputClassName,
        )}
      />
      {shouldShowError ? (
        <span
          id={errorId}
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
    </label>
  );
}
