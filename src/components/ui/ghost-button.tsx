import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import Icon, { type IconName } from "@/components/ui/icon";

export interface GhostButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  leftIcon?: IconName;
  rightIcon?: IconName;
  iconSize?: number;
  iconClassName?: string;
  children: ReactNode;
}

export default function GhostButton({
  children,
  className,
  leftIcon,
  rightIcon,
  iconSize = 24,
  iconClassName,
  disabled,
  ...rest
}: GhostButtonProps) {
  const baseClasses = clsx(
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 body-16 font-medium transition-colors hover:cursor-pointer",
    "bg-transparent text-neutral-200 border border-transparent hover:bg-gray-800/60",
    "disabled:bg-transparent disabled:text-neutral-500 disabled:border-neutral-700 disabled:cursor-not-allowed disabled:opacity-70",
    className
  );

  const renderIcon = (name?: IconName) =>
    name ? (
      <Icon
        name={name}
        size={iconSize}
        className={clsx("text-current", iconClassName)}
      />
    ) : null;

  return (
    <button className={baseClasses} disabled={disabled} {...rest}>
      {renderIcon(leftIcon)}
      <span className="inline-flex items-center justify-center gap-2">
        {children}
      </span>
      {renderIcon(rightIcon)}
    </button>
  );
}
