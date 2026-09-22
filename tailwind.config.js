/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./admin/*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        tide: {
          DEFAULT: "#0E3B43",
          dark: "#082A30"
        },
        coral: {
          DEFAULT: "#E8623C",
          dark: "#C94F2D"
        },
        sand: "#F4ECD8",
        leaf: "#4C7A5E",
        ink: "#1B2421"
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};
