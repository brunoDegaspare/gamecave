import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import Icon, { type IconName } from "@/components/ui/icon";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  icon?: IconName;
  iconSize?: number;
  iconClassName?: string;
  variant?: "error" | "info" | "success" | "warning";
}

export default function Alert({
  children,
  className,
  icon,
  iconSize = 24,
  iconClassName,
  variant = "error",
  role = "alert",
  ...rest
}: AlertProps) {
  const variantClass =
    variant === "success"
      ? "alert-success"
      : variant === "info"
      ? "alert-info"
      : variant === "warning"
      ? "alert-warning"
      : "alert-error";
  const baseClasses = clsx(
    "alert alert-soft body-14",
    variantClass,
    className
  );

  return (
    <div role={role} className={baseClasses} {...rest}>
      {icon ? (
        <Icon
          name={icon}
          size={iconSize}
          className={clsx("text-current", iconClassName)}
        />
      ) : null}
      {children}
    </div>
  );
}
