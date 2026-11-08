import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { DEFAULT_LANG, FALLBACKS, SUPPORTED_LANGS } from './languages';

export { LANGUAGES, SUPPORTED_LANGS, DEFAULT_LANG, SOURCE_LANG } from './languages';

// src/locales/<언어>/common.json 을 자동으로 모두 불러옴 → 폴더만 추가하면 새 언어 문구가 등록됨
const modules = import.meta.glob('../locales/*/common.json', { eager: true });
const resources = {};
for (const [path, mod] of Object.entries(modules)) {
  const code = path.split('/').at(-2);
  resources[code] = { common: mod.default ?? mod };
}

const fallbackLng = { default: [DEFAULT_LANG] };
for (const code of SUPPORTED_LANGS) {
  fallbackLng[code] = FALLBACKS[code].filter((c) => SUPPORTED_LANGS.includes(c));
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ns: ['common'],
    defaultNS: 'common',
    supportedLngs: SUPPORTED_LANGS,
    fallbackLng,
    nonExplicitSupportedLngs: true, // vi-VN → vi, ko-KR → ko
    interpolation: { escapeValue: false },
    detection: {
      // ?lang=vi 로 공유 가능, 선택은 localStorage에 기억. 브라우저 언어는 보지 않고 기본 언어로 시작.
      order: ['querystring', 'localStorage'],
      lookupQuerystring: 'lang',
      caches: ['localStorage'],
    },
  });

function syncDocument(lng) {
  document.documentElement.lang = lng;
  document.title = i18n.t('app.title');
}
i18n.on('languageChanged', syncDocument);
if (i18n.isInitialized) syncDocument(i18n.resolvedLanguage ?? DEFAULT_LANG);
else i18n.on('initialized', () => syncDocument(i18n.resolvedLanguage ?? DEFAULT_LANG));

export default i18n;
