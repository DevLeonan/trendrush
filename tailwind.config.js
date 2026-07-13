/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#050507",
          light: "#FFFFFF",
          cyan: "#00F2EA",
          pink: "#FF0050",
          card: "rgba(10, 10, 12, 0.7)",
          border: "rgba(255, 255, 255, 0.05)",
        }
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'glow-pulse': {
          '0%': { boxShadow: '0 0 5px rgba(0, 242, 234, 0.2), 0 0 10px rgba(255, 0, 80, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 242, 234, 0.5), 0 0 35px rgba(255, 0, 80, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}