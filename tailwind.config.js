const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}", // if you use /pages
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", ...fontFamily.sans],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
  ],
};
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Force your colors to use HEX or RGB manually if needed
      },
    },
  },
  // 👇 This disables modern color functions like oklch
  future: {
    unstable_defaultColorFormat: "hex",
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
  ],
};
