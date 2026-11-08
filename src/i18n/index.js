import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import vi from '../locales/vi/common.json';
import ko from '../locales/ko/common.json';

export const SUPPORTED_LANGS = ['vi', 'ko'];
export const DEFAULT_LANG = 'vi'; // 베트남 학생 대상이므로 기본 언어는 베트남어

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { vi: { common: vi }, ko: { common: ko } },
    ns: ['common'],
    defaultNS: 'common',
    supportedLngs: SUPPORTED_LANGS,
    fallbackLng: DEFAULT_LANG,
    nonExplicitSupportedLngs: true, // vi-VN → vi, ko-KR → ko
    interpolation: { escapeValue: false },
    detection: {
      // ?lang=ko 로 공유 가능, 선택은 localStorage에 기억
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      caches: ['localStorage'],
    },
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
