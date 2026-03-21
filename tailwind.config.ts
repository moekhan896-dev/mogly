import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#0A0A12",
        "bg-card": "#12121E",
        "accent-green": "#00E5A0",
        "accent-red": "#FF6B6B",
        "accent-gold": "#FFD700",
        "text-primary": "#FFFFFF",
        "text-muted": "#6B7280",
        // Score range colors
        "score-gold": "#FFD700",
        "score-green": "#00E5A0",
        "score-amber": "#FBBF24",
        "score-orange": "#F97316",
        "score-red": "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-instrument-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
        display: ["var(--font-instrument-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "glow-green": "radial-gradient(ellipse at center, rgba(0,229,160,0.15) 0%, transparent 70%)",
        "glow-gold": "radial-gradient(ellipse at center, rgba(255,215,0,0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        "glow-green": "0 0 40px rgba(0,229,160,0.3)",
        "glow-gold": "0 0 40px rgba(255,215,0,0.3)",
        "glow-red": "0 0 40px rgba(255,107,107,0.3)",
        "glow-amber": "0 0 40px rgba(251,191,36,0.3)",
        "glow-orange": "0 0 40px rgba(249,115,22,0.3)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0,229,160,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(0,229,160,0.5)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
