/** @type {import('tailwindcss').Config} */
export default {
  // json 포함: src/data/fields.json 의 썸네일 색 클래스가 빌드에서 지워지지 않도록
  content: ['./index.html', './src/**/*.{js,jsx,json}'],
  theme: {
    extend: {
      colors: {
        yu: { DEFAULT: '#0055A4', dark: '#003B73', light: '#E6F0FA' },
      },
      fontFamily: {
        // 글자마다 이 순서로 지원하는 글꼴을 찾음: 베트남어 → 한글 → 키릴(몽골어) → 중국어 간체
        sans: ['"Be Vietnam Pro"', '"Noto Sans KR"', '"Noto Sans"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
