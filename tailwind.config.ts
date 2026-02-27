import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        "exec-navy": "hsl(var(--exec-navy))",
        "strategic-blue": "hsl(var(--strategic-blue))",
        "systems-teal": "hsl(var(--systems-teal))",
        "impact-green": "hsl(var(--impact-green))",
        "primary-text": "hsl(var(--primary-text))",
        "muted-text": "hsl(var(--muted-text))",
        success: "hsl(var(--success) / <alpha-value>)",
        warning: "hsl(var(--warning) / <alpha-value>)",
        danger: "hsl(var(--danger) / <alpha-value>)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionDuration: {
        200: "200ms",
        250: "250ms",
        300: "300ms",
      },
      fontFamily: {
        sans: ["\"IBM Plex Sans\"", "\"Segoe UI\"", "sans-serif"],
        mono: ["\"IBM Plex Mono\"", "\"SFMono-Regular\"", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
