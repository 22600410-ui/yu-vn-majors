import rules from '../data/recommend.json';
import { normalizeQuery } from './localize';
import { tagsOf, aliasesOf } from './keywords';
import { fieldOf } from './fields';

/*
 * 학과 검색: "가장 정확한 학과"와 "비슷한 학과"를 나눠서 돌려줍니다.
 *
 * 1) 점수 매기기 (검색어 한 단어마다 가장 잘 맞는 곳의 점수를 더함)
 *    학과 이름 일치 100 · 이름에 포함 60 · 핵심 해시태그 일치 55 / 포함 40
 *    비슷한 말(aliases) 일치 45 / 포함 30 · 세부 전공 25 · 전공 교육 분야 12 · 소개 글에 언급 6
 * 2) 가장 정확한 학과 = 1등 점수의 절반 이상이면서 25점 이상
 * 3) 비슷한 학과 = 정확한 학과와 같은 관심 분야 묶음(recommend.json)에 있는 학과
 *                 + 같은 계열 + 소개 글에만 살짝 언급된 학과
 */

const W = { nameExact: 100, nameIncl: 60, tagExact: 55, tagIncl: 40, aliasExact: 45, aliasIncl: 30, major: 25, field: 12, text: 6 };
const BEST_MIN = 25;

// 모든 학과에 걸리는 말은 검색어에서 뺌 (예: "중국어 학과" → "중국어")
const STOP = new Set(['학과', '학부', '전공', '과', '대학', '대학교', '공부', '관련', '분야', '배우고', '싶어', '싶어요', 'nganh', 'khoa', 'hoc', 'muon', 'department', 'major']);

const values = (loc) => (!loc ? [] : typeof loc === 'string' ? [loc] : Object.values(loc).filter(Boolean));
const isLatin = (s) => /^[a-z0-9 .·\-+]+$/.test(s);

/** v(학과 쪽 단어)와 tok(검색어 단어)가 얼마나 맞는지: 'exact' | 'incl' | null */
function compare(v, tok) {
  if (!v || !tok) return null;
  if (v === tok) return 'exact';
  if (isLatin(tok)) {
    // 영문·베트남어(성조 제거)는 단어 앞부분 일치만 인정 ("ai" 가 "tai chinh" 에 걸리지 않게)
    if (tok.length >= 3 && v.split(/\s+/).some((w) => w.startsWith(tok))) return 'incl';
    if (v.length >= 4 && isLatin(v) && ` ${tok} `.includes(` ${v} `)) return 'incl';
    return null;
  }
  if (tok.length >= 2 && v.includes(tok)) return 'incl'; // 학과 쪽에 검색어가 들어 있음 (반도체 → 차세대반도체학과)
  if (v.length >= 2 && tok.includes(v)) return 'incl'; // 검색어에 학과 키워드가 들어 있음 (중국어를 → 중국어)
  return null;
}

function scoreToken(tok, d) {
  let best = 0;
  let hit = null;
  const test = (cands, exact, incl) => {
    for (const raw of cands) {
      const r = compare(normalizeQuery(raw), tok);
      const s = r === 'exact' ? exact : r === 'incl' ? incl : 0;
      if (s > best) {
        best = s;
        hit = raw;
      }
    }
  };
  test(values(d.name), W.nameExact, W.nameIncl);
  test(tagsOf(d).flatMap(values), W.tagExact, W.tagIncl);
  test(aliasesOf(d), W.aliasExact, W.aliasIncl);
  test(d.majors.flatMap((m) => values(m.name)), W.major, W.major);
  test((d.fields ?? []).flatMap(values), W.field, W.field);
  if (best < W.text && tok.length >= 2) {
    const long = normalizeQuery([...values(d.slogan), ...values(d.description), ...values(d.majorGuide)].join(' '));
    if (long.includes(tok)) {
      best = W.text;
      hit = null;
    }
  }
  return { score: best, hit };
}

function scoreDepartment(query, d) {
  const tokens = query.split(/[\s,/]+/).filter((tok) => tok && !STOP.has(tok));
  if (tokens.length === 0) return { score: 0, hits: [] };
  const whole = STOP.has(query) ? { score: 0, hit: null } : scoreToken(query, d);
  let sum = 0;
  const hits = [];
  for (const tok of tokens) {
    const r = scoreToken(tok, d);
    sum += r.score;
    if (r.hit && !hits.includes(r.hit)) hits.push(r.hit);
  }
  if (whole.score >= sum) return { score: whole.score, hits: whole.hit ? [whole.hit] : [] };
  return { score: sum, hits };
}

/**
 * @returns {{ best: Array<{department, college, score, hits}>, similar: Array<{department, college, reason}> }}
 *   reason: { type: 'interest', item } | { type: 'field', item } | { type: 'text' }
 */
export function searchDepartments(data, rawQuery, { similarLimit = 8 } = {}) {
  const query = normalizeQuery(rawQuery);
  const all = (data?.colleges ?? []).flatMap((college) => college.departments.map((department) => ({ department, college })));
  if (!query) return { best: [], similar: [] };

  const scored = all
    .map((x) => ({ ...x, ...scoreDepartment(query, x.department) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.department.name.ko.localeCompare(b.department.name.ko, 'ko'));
  if (scored.length === 0) return { best: [], similar: [] };

  const cut = Math.max(BEST_MIN, scored[0].score * 0.5);
  const best = scored.filter((x) => x.score >= cut);
  const bestNames = new Set(best.map((x) => x.department.name.ko));
  const byName = new Map(all.map((x) => [x.department.name.ko, x]));

  // 비슷한 학과 점수
  const sim = new Map();
  const add = (name, points, reason) => {
    if (bestNames.has(name) || !byName.has(name)) return;
    const cur = sim.get(name) ?? { ...byName.get(name), sim: 0, reason };
    cur.sim += points;
    if (points >= (cur.reasonPoints ?? 0)) {
      cur.reason = reason;
      cur.reasonPoints = points;
    }
    sim.set(name, cur);
  };

  const anchors = best.slice(0, 3);
  for (const item of rules.interests) {
    const members = [...item.primary, ...item.related];
    for (const a of anchors) {
      const name = a.department.name.ko;
      if (!members.includes(name)) continue;
      const anchorPrimary = item.primary.includes(name);
      for (const m of members) add(m, anchorPrimary && item.primary.includes(m) ? 2 : 1, { type: 'interest', item });
    }
  }
  const anchorField = anchors[0] && fieldOf(anchors[0].department, anchors[0].college);
  if (anchorField) {
    for (const x of all) {
      if (fieldOf(x.department, x.college)?.id === anchorField.id) add(x.department.name.ko, 0.5, { type: 'field', item: anchorField });
    }
  }
  for (const x of scored) {
    if (x.score < cut) add(x.department.name.ko, 1.5, { type: 'text' });
  }

  const similar = [...sim.values()].sort((a, b) => b.sim - a.sim).slice(0, similarLimit);
  return { best, similar };
}
