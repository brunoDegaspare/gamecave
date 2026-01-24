import React from "react";

interface CardStatProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  iconColor?: string;
}

export default function CardStat({
  icon,
  title,
  value,
  iconColor = "text-primary", // default icon color
}: CardStatProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl bg-base-200/70 transition-colors duration-500 hover:bg-base-200 px-6 py-4">
      {/* Header (icon + title) */}
      <div className="flex items-center gap-2">
        <span className={`${iconColor}`}>{icon}</span>
        <span className="body-16 md:body-14 weight-medium text-base-content/60">
          {title}
        </span>
      </div>

      {/* Value */}
      <div className="mt-4 heading-3 weight-bold text-base-content tracking-tight">
        {value}
      </div>
    </div>
  );
}
