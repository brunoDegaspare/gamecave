/**
 * InfoCard
 *
 * A lightweight, reusable container used to display short pieces of information,
 * such as statistics, labels, or small data blocks (e.g. Rating, Players, Release Date).
 *
 * Example:
 * <InfoCard>
 *   <InfoCardContent>
 *     <span className="text-2xl font-semibold">4.5</span>
 *     <span className="text-xs text-base-content/50">Rating</span>
 *   </InfoCardContent>
 * </InfoCard>
 */

"use client";

import * as React from "react";

export function InfoCard({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-base-300 bg-base-200 text-base-content shadow-sm transition-colors hover:border-base-content/20 ${className}`}
      {...props}
    />
  );
}

export function InfoCardContent({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 ${className}`} {...props} />;
}
