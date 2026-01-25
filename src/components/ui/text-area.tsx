import type { ReactNode, TextareaHTMLAttributes } from "react";
import clsx from "clsx";
import Icon from "@/components/ui/icon";

export type TextAreaProps = {
  label: string;
  error?: string;
  errorId?: string;
  showError?: boolean;
  rightSlot?: ReactNode;
  containerClassName?: string;
  textareaClassName?: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;

export default function TextArea({
  label,
  error,
  errorId,
  showError,
  rightSlot,
  containerClassName,
  textareaClassName,
  value,
  ...textareaProps
}: TextAreaProps) {
  const shouldShowError =
    Boolean(error) && (typeof showError === "boolean" ? showError : true);

  return (
    <label className={clsx("block space-y-2", containerClassName)}>
      {rightSlot ? (
        <div className="flex items-center justify-between gap-4">
          <span className="body-16 text-base-content/70">{label}</span>
          {rightSlot}
        </div>
      ) : (
        <div className="body-16 text-base-content/70">{label}</div>
      )}
      <textarea
        {...textareaProps}
        value={value}
        aria-invalid={shouldShowError}
        aria-describedby={shouldShowError && errorId ? errorId : undefined}
        className={clsx(
          "gc-input-surface gc-placeholder w-full min-h-[120px] rounded-lg border border-base-300 bg-transparent px-3 py-2 text-base-content/70 placeholder-base-content/50 focus:bg-base-200/70 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary transition-all duration-300 ease-in-out placeholder:transition-opacity placeholder:duration-200 placeholder:ease-out",
          shouldShowError
            ? "border-error focus:border-error focus:ring-error opacity-100"
            : "border-base-300 focus:border-primary focus:ring-primary",
          textareaClassName,
        )}
      />
      {shouldShowError ? (
        <span
          id={errorId}
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
    </label>
  );
}
