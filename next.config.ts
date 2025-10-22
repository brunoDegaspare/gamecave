// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    // SVG como componente React (herda cor via `currentColor`)
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      resourceQuery: { not: [/url/] }, // exclui *.svg?url
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            icon: true,
            svgo: true,
            dimensions: false,
            svgoConfig: {
              plugins: [
                "preset-default",
                { name: "removeViewBox", active: false },
                {
                  name: "removeAttrs",
                  params: { attrs: "svg:preserveAspectRatio" },
                },
                { name: "convertColors", params: { currentColor: true } },
              ],
            },
          },
        },
      ],
    });

    // Quando quiser a URL do arquivo: import url from './icon.svg?url'
    config.module.rules.push({
      test: /\.svg$/i,
      type: "asset/resource",
      resourceQuery: /url/, // apenas *.svg?url
    });

    return config;
  },
};

export default nextConfig;
