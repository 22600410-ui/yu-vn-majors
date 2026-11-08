import rules from '../data/recommend.json';

export { rules };

const POINTS = { primary: 3, related: 1, career: 2 };

/**
 * 규칙 기반 학과 추천 (학과 추천 페이지와 추천 챗봇이 함께 사용)
 * @param data      departments.json
 * @param answers   { track: 'freshman'|'transfer'|'unsure', interests: string[], career: string|null }
 * @returns [{ department, college, score, reasons: [{type:'interest'|'career', item}] }]
 */
export function recommend(data, { track = 'unsure', interests = [], career = null }, limit = 6) {
  if (!data) return [];
  const byName = new Map();
  for (const college of data.colleges) {
    for (const department of college.departments) byName.set(department.name.ko, { department, college });
  }

  const results = new Map();
  const add = (name, points, reason) => {
    const hit = byName.get(name);
    if (!hit) return;
    const r = results.get(name) ?? { ...hit, score: 0, reasons: [] };
    r.score += points;
    if (!r.reasons.some((x) => x.item.id === reason.item.id)) r.reasons.push(reason);
    results.set(name, r);
  };

  for (const id of interests) {
    const item = rules.interests.find((i) => i.id === id);
    if (!item) continue;
    item.primary.forEach((n) => add(n, POINTS.primary, { type: 'interest', item }));
    item.related.forEach((n) => add(n, POINTS.related, { type: 'interest', item }));
  }
  const careerItem = rules.careers.find((c) => c.id === career);
  if (careerItem) careerItem.departments.forEach((n) => add(n, POINTS.career, { type: 'career', item: careerItem }));

  return [...results.values()]
    .filter((r) => track === 'unsure' || r.department.admission?.[track])
    .sort((a, b) => b.score - a.score || a.department.name.ko.localeCompare(b.department.name.ko, 'ko'))
    .slice(0, limit);
}
