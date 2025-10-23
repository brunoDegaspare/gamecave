import React from "react";

interface CardStatProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  iconColor?: string; // 👈 new prop (Tailwind color class)
}

export default function CardStat({
  icon,
  title,
  value,
  iconColor = "text-violet-400", // default color
}: CardStatProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl bg-neutral-900/70 px-6 py-4">
      {/* Header (icon + title) */}
      <div className="flex items-center gap-2">
        <span className={`text-[20px] ${iconColor}`}>{icon}</span>
        <span className="text-[14px] font-medium text-neutral-400">
          {title}
        </span>
      </div>

      {/* Value */}
      <div className="mt-4 text-[32px] font-bold text-white leading-none">
        {value}
      </div>
    </div>
  );
}
