import { FALLBACKS, SOURCE_LANG } from '../i18n/languages';

/**
 * departments.json 의 LocalizedText = { ko: "원문", vi?: "...", en?: "...", zh?: "...", mn?: "..." }
 *
 * 현재 언어 값이 없으면 config/languages.json 의 fallback 순서(예: vi → en → ko)로 대체하고,
 * 대체됐는지(isFallback)와 실제로 표시한 언어(lang)를 돌려줘 UI에서 배지를 띄울 수 있게 합니다.
 */
export function localize(text, lang) {
  if (!text) return { value: '', lang: null, isFallback: false };
  if (typeof text === 'string') return { value: text, lang: null, isFallback: false };

  const order = [lang, ...(FALLBACKS[lang] ?? [SOURCE_LANG])];
  for (const l of order) {
    if (text[l]) return { value: text[l], lang: l, isFallback: l !== lang };
  }
  return { value: '', lang: null, isFallback: false };
}

/** 값만 필요할 때 */
export const tr = (text, lang) => localize(text, lang).value;

/** 검색용: 모든 언어 값을 합친 문자열 (베트남어 성조 제거 포함) */
export function searchableText(...texts) {
  return texts
    .flat()
    .filter(Boolean)
    .map((t) => (typeof t === 'string' ? t : Object.values(t).join(' ')))
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
}

export function normalizeQuery(q) {
  return searchableText(q).trim();
}

/** 날짜를 현재 언어 형식으로 (잘못된 값이면 빈 문자열) */
export function formatDate(iso, lang) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' });
}
