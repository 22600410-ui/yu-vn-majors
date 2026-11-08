import faq from '../data/faq.json';
import { normalizeQuery, tr } from './localize';

export const FAQ_CATEGORIES = faq.categories;

/** 고정 FAQ + 수집 데이터로 만든 '졸업 후 진로' FAQ */
export function buildFaqs(data) {
  const byName = new Map();
  for (const college of data?.colleges ?? []) {
    for (const department of college.departments) byName.set(department.name.ko, { department, college });
  }
  const resolve = (names = []) => names.map((n) => byName.get(n)).filter(Boolean);

  const items = faq.items.map((x) => ({ ...x, kind: 'static', related: resolve(x.departments) }));
  for (const name of faq.careerDepartments) {
    const hit = byName.get(name);
    if (!hit?.department.careers?.length) continue;
    items.push({ id: `career-${hit.department.id}`, category: 'career', kind: 'career', related: [hit], ...hit });
  }
  return items;
}

/** 화면에 보여 줄 질문·답변 문자열 (현재 언어 기준) */
export function faqText(item, t, lang) {
  if (item.kind === 'career') {
    const dept = tr(item.department.name, lang);
    const lines = item.department.careers.map((c) => {
      const cat = tr(c.category, lang);
      const detail = tr(c.detail, lang);
      return cat ? `· ${cat}: ${detail}` : `· ${detail}`;
    });
    return { q: t('faq.careerQ', { dept }), a: lines.join('\n') };
  }
  return { q: tr(item.q, lang), a: tr(item.a, lang) };
}

/** 챗봇 자유 질문 → 가장 잘 맞는 FAQ (없으면 null) */
export function matchFaq(items, text, t, lang, { exactOnly = false } = {}) {
  const q = normalizeQuery(text);
  if (!q) return null;
  let best = null;
  let bestScore = 0;
  for (const item of items) {
    // 1) 질문 문장과 똑같으면 바로 선택 (FAQ 버튼에서 보낸 질문)
    const texts = item.kind === 'static' ? Object.values(item.q) : [faqText(item, t, lang).q];
    if (texts.some((s) => normalizeQuery(s) === q)) return item;
    if (exactOnly) continue;
    // 2) 키워드가 몇 개 들어 있는지로 점수
    const keywords = item.kind === 'static' ? item.keywords ?? [] : [item.department.name.ko, '진로', '취업', 'nghe nghiep'];
    const score = keywords.reduce((s, k) => s + (q.includes(normalizeQuery(k)) ? 1 : 0), 0);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}

export const featuredFaqs = (items) => items.filter((x) => x.featured);
