import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx,mdx}",
    "./src/components/**/*.{ts,tsx,mdx}",
    "./src/services/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        border: "var(--border)",
      },
      fontFamily: {
        sans: ["var(--font-sora)", "Sora", "system-ui", "sans-serif"],
        mono: [
          "var(--font-geist-mono)",
          "Geist Mono",
          "ui-monospace",
          "SFMono-Regular",
        ],
      },
      borderRadius: {
        touch: "var(--radius-touch)",
      },
      minHeight: {
        touch: "48px",
      },
    },
  },
};

export default config;
