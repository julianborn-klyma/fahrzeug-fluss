import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
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
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        "badge-lager": "hsl(var(--badge-lager))",
        "badge-lager-text": "hsl(var(--badge-lager-text))",
        "badge-bestellung": "hsl(var(--badge-bestellung))",
        "badge-bestellung-text": "hsl(var(--badge-bestellung-text))",
        "badge-teamleiter": "hsl(var(--badge-teamleiter))",
        "badge-teamleiter-text": "hsl(var(--badge-teamleiter-text))",
        "badge-office": "hsl(var(--badge-office))",
        "badge-office-text": "hsl(var(--badge-office-text))",
        "badge-monteur": "hsl(var(--badge-monteur))",
        "badge-monteur-text": "hsl(var(--badge-monteur-text))",
        "trade-shk": "hsl(var(--trade-shk))",
        "trade-shk-border": "hsl(var(--trade-shk-border))",
        "trade-shk-text": "hsl(var(--trade-shk-text))",
        "trade-elektro": "hsl(var(--trade-elektro))",
        "trade-elektro-border": "hsl(var(--trade-elektro-border))",
        "trade-elektro-text": "hsl(var(--trade-elektro-text))",
        "trade-fundament": "hsl(var(--trade-fundament))",
        "trade-fundament-border": "hsl(var(--trade-fundament-border))",
        "trade-fundament-text": "hsl(var(--trade-fundament-text))",
        "trade-dach": "hsl(var(--trade-dach))",
        "trade-dach-border": "hsl(var(--trade-dach-border))",
        "trade-dach-text": "hsl(var(--trade-dach-text))",
        "trade-gala": "hsl(var(--trade-gala))",
        "trade-gala-border": "hsl(var(--trade-gala-border))",
        "trade-gala-text": "hsl(var(--trade-gala-text))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
