// config/languages.json 을 화면 코드에서 쓰기 좋은 형태로 정리 (크롤러와 같은 파일을 공유)
import config from '../../config/languages.json';

export const SOURCE_LANG = config.source;
export const DEFAULT_LANG = config.default;

/** 사이트에서 선택할 수 있는 언어 [{ code, label, fallback }] */
export const LANGUAGES = config.languages.filter((l) => l.enabled);
export const SUPPORTED_LANGS = LANGUAGES.map((l) => l.code);

/** 언어별 대체 순서: 번역이 없을 때 이 순서로 다른 언어를 보여 줌 (마지막은 항상 원문) */
export const FALLBACKS = Object.fromEntries(
  config.languages.map((l) => [l.code, [...(l.fallback ?? []), SOURCE_LANG].filter((c, i, a) => c !== l.code && a.indexOf(c) === i)]),
);

export const labelOf = (code) => config.languages.find((l) => l.code === code)?.label ?? code;
