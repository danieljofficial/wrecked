/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "#FDDA24",
          black: "#0F0F0F",
          white: "#F6F7F8",
          beige: "#D6D2C4",
          lavender: "#B7ACE8",
          teal: "#00A7B5",
          navy: "#002E5D",
        },
        cell: {
          empty: "#002E5D",
          ship: "#FDDA24",
          hit: "#00A7B5",
          miss: "#D6D2C4",
          hover: "#B7ACE8",
        },
      },
      fontFamily: {
        lora: ["Lora", "serif"],
        inter: ["Inter", "sans-serif"],
        mono: ["'Roboto Mono'", "monospace"],
      },
      animation: {
        "proof-pulse": "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
