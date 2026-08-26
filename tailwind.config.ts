import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B2430",       // primary text / dark surfaces
        vellum: "#E8E2CC",    // page background, aged paper
        vellumDark: "#D9D0AE",
        patina: "#5B7065",    // primary accent - verdigris
        brass: "#A9812F",     // secondary accent - highlights, seals
        oxblood: "#6B2C2C",   // generation dividers, alerts
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        seal: "50%",
      },
    },
  },
  plugins: [],
};
export default config;
