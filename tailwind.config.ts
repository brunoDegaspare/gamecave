// Sem tipar o objeto
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
  plugins: [],
};

export default config;
