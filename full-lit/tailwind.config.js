/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,html,js,css}'],
  plugins: [require('@tailwindcss/forms')],
  theme: {
    extend: {
      animation: {
        fade: 'fadeIn 300ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
};
