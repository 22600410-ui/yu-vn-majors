/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        yu: { DEFAULT: '#0055A4', dark: '#003B73', light: '#E6F0FA' },
      },
      fontFamily: {
        // Be Vietnam Pro: 베트남어 성조 표기 지원 / Noto Sans KR: 한글
        sans: ['"Be Vietnam Pro"', '"Noto Sans KR"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
