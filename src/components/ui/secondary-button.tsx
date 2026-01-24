import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import Icon, { type IconName } from "@/components/ui/icon";

export interface SecondaryButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  size: "md" | "lg";
  showIcon?: boolean;
  iconOnly?: IconName;
  leftIcon?: IconName;
  rightIcon?: IconName;
  iconSize?: number;
  iconClassName?: string;
  children: ReactNode;
}

export default function SecondaryButton({
  children,
  className,
  size,
  leftIcon,
  rightIcon,
  iconOnly,
  showIcon = Boolean(leftIcon || rightIcon),
  iconSize,
  iconClassName,
  disabled,
  ...rest
}: SecondaryButtonProps) {
  const resolvedIconSize =
    iconSize ?? (iconOnly ? (size === "lg" ? 32 : 24) : 24);
  const hasIconOnly = Boolean(iconOnly);
  const shouldShowIcons = hasIconOnly || showIcon;
  const sizeClasses =
    size === "lg" ? "px-5 py-4 body-18 leading-[26px]" : "px-4 py-2 body-16";

  const baseClasses = clsx(
    "inline-flex items-center justify-center gap-2 rounded-lg weight-semibold box-border transition-all duration-300 ease-out hover:cursor-pointer",
    sizeClasses,
    "bg-transparent border border-secondary text-secondary shadow-[0_0_12px_oklch(var(--s)/0.25)] hover:bg-secondary/10 hover:border-secondary-focus hover:shadow-[0_0_16px_oklch(var(--s)/0.4)]",
    "disabled:border-base-300 disabled:text-base-content/40 disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-70",
    className
  );

  const renderIcon = (name?: IconName) =>
    shouldShowIcons && name ? (
      <Icon
        name={name}
        size={resolvedIconSize}
        className={clsx("text-current", iconClassName)}
      />
    ) : null;

  return (
    <button className={baseClasses} disabled={disabled} {...rest}>
      {hasIconOnly ? (
        renderIcon(iconOnly)
      ) : (
        <>
          {renderIcon(leftIcon)}
          <span className="inline-flex items-center justify-center gap-2">
            {children}
          </span>
          {renderIcon(rightIcon)}
        </>
      )}
    </button>
  );
}
