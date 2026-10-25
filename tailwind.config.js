/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: "#f8f3eb",
        "deep-ink": "#080331",
        "midnight-violet": "#1b1463",
        "primary-indigo": "#4865ff",
        forest: "#328a3b",
        ember: "#ff6d39",
        blossom: "#f098d7",
        petal: "#ffaefe",
        meadow: "#114e0b",
        "lavender-mist": "#a2baff",
        "info-blue": "#dce4fb",
        stone: "#333333",
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': 'rgba(75, 68, 57, 0.05) 0px 4px 4px 0px, rgba(75, 68, 57, 0.08) 0px 32px 16px 0px',
        'warm-md': 'rgba(99, 91, 79, 0.08) 0px 8px 16px 0px, rgba(99, 91, 79, 0.04) 0px 32px 32px 0px',
        'warm-lg': 'rgba(75, 68, 57, 0.1) 0px 12px 24px 0px, rgba(75, 68, 57, 0.1) 0px 48px 48px 0px',
        'warm-xl': 'rgba(75, 68, 57, 0.1) 0px 48px 48px 0px',
      },
      borderRadius: {
        'pill': '1600px',
      }
    },
  },
  plugins: [],
}
