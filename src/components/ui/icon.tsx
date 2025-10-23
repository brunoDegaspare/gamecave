"use client";

import * as React from "react";
import clsx from "clsx";
import { iconsMap, IconName } from "@/components/generated/icons-map";

export type { IconName } from "@/components/generated/icons-map";
export type IconProps = {
  name: IconName;
  className?: string;
  viewBox?: string;
  size?: number;
};

// Type for components that return a ReactElement (usually <svg>)
type IconComponentFn = (
  props: Record<string, unknown>
) => React.ReactElement | null;
type SvgEl = React.ReactElement<React.SVGProps<SVGSVGElement>>;

export default function Icon({ name, className, viewBox, size }: IconProps) {
  const Comp = iconsMap[name] as unknown as IconComponentFn | undefined;

  if (!Comp) {
    console.warn(`Icon "${name}" not found in iconsMap.`);
    return null;
  }

  // Render original icon component
  const rendered = Comp({});

  // If it returned an <svg>, clone and inject props
  if (
    React.isValidElement(rendered) &&
    typeof rendered.type === "string" &&
    rendered.type === "svg"
  ) {
    const svgProps = rendered.props as React.SVGProps<SVGSVGElement>;

    return React.cloneElement(rendered as SvgEl, {
      // 1) tamanho controlado por prop (fallback para tamanho original)
      width: size ?? svgProps.width,
      height: size ?? svgProps.height,

      // 2) viewBox e aspecto preservados
      viewBox: viewBox ?? svgProps.viewBox ?? "0 0 24 24",
      preserveAspectRatio: svgProps.preserveAspectRatio ?? "xMidYMid meet",

      // 3) herdar cor do texto
      fill: svgProps.fill ?? "currentColor",

      // 4) aplicar className do caller + a existente
      className: clsx(svgProps.className, className),

      // 5) acessibilidade padrão
      focusable: svgProps.focusable ?? "false",
      "aria-hidden": svgProps["aria-hidden"] ?? true,
    });
  }

  // Fallback: não é <svg>, renderiza como veio
  return rendered;
}
