import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages: https://<user>.github.io/<repo>/ 로 배포되므로 base를 저장소 이름에 맞춥니다.
// 사용자 페이지(<user>.github.io 저장소)라면 '/' 로 바꾸세요.
export default defineConfig({
  plugins: [react()],
  base: '/yu-vn-majors/',
});
