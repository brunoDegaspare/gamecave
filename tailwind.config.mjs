import lineClamp from "@tailwindcss/line-clamp";
import daisyui from "daisyui";
import scrollbar from "tailwind-scrollbar";

const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    {
      pattern: /(sm|md|lg|xl):body-(12|14|16|18)/,
      variants: ["sm", "md", "lg", "xl"],
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-saira)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [lineClamp, scrollbar({ nocompatible: true }), daisyui],
};

export default config;
