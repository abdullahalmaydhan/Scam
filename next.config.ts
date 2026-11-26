import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page depends on the language/theme cookie (sos.lang, sos.theme),
  // so pages render per request. Cache Components stays off.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
