// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1D4ED8', // A professional blue
        secondary: '#9333EA', // A complementary purple
        background: '#F9FAFB', // Light background
        card: '#FFFFFF', // White for cards
        text: '#1F2937', // Dark gray for text
        muted: '#6B7280', // Muted gray for secondary text
      },
    },
  },
  plugins: [],
}
