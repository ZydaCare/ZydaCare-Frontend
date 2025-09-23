/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter-Regular', 'sans-serif'],
        'sans-medium': ['Inter-Medium', 'sans-serif'],
        'sans-semibold': ['Inter-SemiBold', 'sans-serif'],
        'sans-bold': ['Inter-Bold', 'sans-serif'],
      },
      colors: {
        primary: "#67A9AF",
        secondary: "#D65C1E"
      },
    },
  },
  plugins: [],
}