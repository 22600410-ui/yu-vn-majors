/**
 * departments.json 의 LocalizedText = { ko: string, vi: string }
 *
 * 현재 언어 값이 비어 있으면 다른 언어로 대체하고,
 * 대체됐는지 여부(isFallback)를 함께 돌려줘 UI에서 "한국어 원문" 배지를 띄울 수 있게 합니다.
 */
const FALLBACK_ORDER = { vi: ['vi', 'ko'], ko: ['ko', 'vi'] };

export function localize(text, lang) {
  if (!text) return { value: '', lang: null, isFallback: false };
  if (typeof text === 'string') return { value: text, lang: null, isFallback: false };

  const order = FALLBACK_ORDER[lang] ?? [lang, 'ko', 'vi'];
  for (const l of order) {
    if (text[l]) return { value: text[l], lang: l, isFallback: l !== lang };
  }
  return { value: '', lang: null, isFallback: false };
}

/** 값만 필요할 때 */
export const tr = (text, lang) => localize(text, lang).value;

/** 검색용: 두 언어를 모두 합친 문자열 (베트남어 성조 제거 포함) */
export function searchableText(...texts) {
  return texts
    .flat()
    .filter(Boolean)
    .map((t) => (typeof t === 'string' ? t : `${t.ko ?? ''} ${t.vi ?? ''}`))
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
}

export function normalizeQuery(q) {
  return searchableText(q).trim();
}
