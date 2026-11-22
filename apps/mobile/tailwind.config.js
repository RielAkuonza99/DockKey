/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: { coral: "#F47791", teal: "#278F7D", orange: "#F6AA50", lavender: "#A9A2F4", cream: "#FFF9E9" },
        light: { background: "#FFF9E9", surface: "#FFFFFF", text: "#24232B", muted: "#77747C" },
        dark: { background: "#171923", surface: "#242633", elevated: "#303342", text: "#F7F5F0", muted: "#B6B5C0" }
      },
      borderRadius: { card: "24px", hero: "28px", control: "16px" }
    }
  },
  plugins: []
};
