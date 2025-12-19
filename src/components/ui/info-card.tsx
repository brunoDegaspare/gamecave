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
 *     <span className="text-xs text-neutral-500">Rating</span>
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
      className={`rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 shadow-sm transition-colors hover:border-neutral-700 ${className}`}
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
