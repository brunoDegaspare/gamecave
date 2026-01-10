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
    "inline-flex items-center justify-center gap-2 rounded-lg weight-semibold transition-colors hover:cursor-pointer",
    sizeClasses,
    "bg-transparent border border-white text-white hover:bg-white/10",
    "disabled:bg-transparent disabled:text-neutral-500 disabled:border-neutral-700 disabled:cursor-not-allowed disabled:opacity-70",
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
