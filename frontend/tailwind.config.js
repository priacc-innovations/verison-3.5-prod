/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],


  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#7C3AED",
          dark: "#5B21B6",
          accent: "#A78BFA",
        },
      },
      boxShadow: {
        glass: "0 20px 40px rgba(0,0,0,0.25)",
        glow: "0 0 40px rgba(124,58,237,0.35)",
      },
      backdropBlur: {
        xl: "24px",
      },
    },
  },

};
