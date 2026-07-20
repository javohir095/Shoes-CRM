/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
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
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        leather: {
          DEFAULT: "hsl(var(--leather))",
          foreground: "hsl(var(--leather-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 10px)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
        "glass-lg": "0 20px 60px -10px rgba(0, 0, 0, 0.15)",
        glow: "0 0 0 1px hsl(var(--primary) / 0.15), 0 8px 24px -8px hsl(var(--primary) / 0.35)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        // Opacity-only — safe for Radix Popper content (Select/Popover/
        // DropdownMenu), which positions itself via an inline `transform`.
        // A keyframe that also animates `transform` briefly overrides that
        // inline positioning for the animation's duration, so the popup
        // visually jumps from the wrong spot to the right one every time
        // it opens — enough to make a tap land somewhere unintended.
        "popper-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "popper-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "overlay-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "overlay-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        // Dialog content centers itself with a static translate(-50%,-50%);
        // the centering offset is baked into both ends of this keyframe so
        // it never gets clobbered mid-animation the way fade-in's transform
        // did.
        "dialog-in": {
          "0%": { opacity: "0", transform: "translate(-50%, -50%) scale(0.96)" },
          "100%": { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "dialog-out": {
          "0%": { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
          "100%": { opacity: "0", transform: "translate(-50%, -50%) scale(0.96)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "popper-in": "popper-in 0.15s ease-out",
        "popper-out": "popper-out 0.1s ease-in",
        "overlay-in": "overlay-in 0.2s ease-out",
        "overlay-out": "overlay-out 0.15s ease-in",
        "dialog-in": "dialog-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "dialog-out": "dialog-out 0.15s ease-in",
      },
    },
  },
  plugins: [],
};
