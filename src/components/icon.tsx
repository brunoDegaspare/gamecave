"use client";

import * as React from "react";
import clsx from "clsx";
import { iconsMap, IconName } from "@/components/generated/icons-map";

export type IconProps = {
  name: IconName;
  className?: string;
  viewBox?: string;
};

// Type for components that return a ReactElement (usually <svg>)
type IconComponentFn = (
  props: Record<string, unknown>
) => React.ReactElement | null;
type SvgEl = React.ReactElement<React.SVGProps<SVGSVGElement>>;

export default function Icon({ name, className, viewBox }: IconProps) {
  const Comp = iconsMap[name] as unknown as IconComponentFn | undefined;

  if (!Comp) {
    console.warn(`Icon "${name}" not found in iconsMap.`);
    return null;
  }

  // Call the component directly to get the actual <svg> element
  const rendered = Comp({});

  // If the component returned a <svg>, clone it and inject our custom props
  if (
    React.isValidElement(rendered) &&
    typeof rendered.type === "string" &&
    rendered.type === "svg"
  ) {
    const svgProps = rendered.props as React.SVGProps<SVGSVGElement>;

    return React.cloneElement(rendered as SvgEl, {
      // merge existing classes with ours
      className: clsx("w-full h-full", svgProps.className, className),
      // ensure it scales correctly
      viewBox: viewBox ?? svgProps.viewBox ?? "0 0 24 24",
      preserveAspectRatio: svgProps.preserveAspectRatio ?? "xMidYMid meet",
      // inherit color from parent text color
      fill: svgProps.fill ?? "currentColor",
    });
  }

  // Fallback: if it's not a <svg>, just render it as is
  return rendered;
}
