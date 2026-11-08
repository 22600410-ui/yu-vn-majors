import test from '../data/major-test.json';

export const QUESTIONS = test.questions;
export const TYPES = test.types;
const ORDER = TYPES.map((t) => t.id); // R I A S E C (동점이면 이 순서)

export const typeById = (id) => TYPES.find((t) => t.id === id) ?? null;

// 마지막 테스트 결과를 이 브라우저에만 기억 → '학과 추천' 메뉴에서 다시 보여 줌 (서버로 보내지 않음)
const LAST_KEY = 'yu-major-test-last';
export function saveLastResult(code, scores) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ code, scores, at: Date.now() }));
  } catch {
    /* 저장이 막힌 브라우저(사생활 보호 모드 등)는 그냥 넘어감 */
  }
}
export function loadLastResult() {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY) ?? 'null');
    return v && parseCode(v.code) ? v : null;
  } catch {
    return null;
  }
}

/** 답 배열(['R','I',...]) → 유형별 점수 {R:2, I:3, ...} */
export function scoreAnswers(answers) {
  const scores = Object.fromEntries(ORDER.map((id) => [id, 0]));
  for (const a of answers) if (a in scores) scores[a] += 1;
  return scores;
}

/** 점수 → 결과 코드 (1위+2위, 예: 'IA') */
export function codeFromScores(scores) {
  const ranked = [...ORDER].sort((a, b) => scores[b] - scores[a] || ORDER.indexOf(a) - ORDER.indexOf(b));
  return ranked.slice(0, 2).join('');
}

/** 주소의 결과 코드가 올바른지 ('I', 'IA' 처럼 서로 다른 유형 1~2개) */
export function parseCode(code = '') {
  const up = code.toUpperCase();
  if (!/^[RIASEC]{1,2}$/.test(up) || up[0] === up[1]) return null;
  return up.split('').map(typeById);
}

/**
 * 결과 유형에 어울리는 학과
 * 1위 유형 목록에서 앞쪽일수록 높게(최대 3점), 2위 유형 목록은 최대 2점 → 합산
 * 두 유형에 모두 들어 있는 학과가 '조합 추천'으로 위에 올라옴
 */
export function recommendByTypes(data, [first, second], { track = 'all', limit = 6 } = {}) {
  const byName = new Map();
  for (const college of data?.colleges ?? []) {
    for (const department of college.departments) byName.set(department.name.ko, { department, college });
  }
  const score = new Map();
  const add = (type, weight) => {
    if (!type) return;
    type.departments.forEach((name, i) => {
      if (!byName.has(name)) return;
      const cur = score.get(name) ?? { ...byName.get(name), score: 0, types: [] };
      cur.score += weight * (1 - i / (type.departments.length + 1));
      cur.types.push(type.id);
      score.set(name, cur);
    });
  };
  add(first, 3);
  add(second, 2);
  return [...score.values()]
    .filter((x) => track === 'all' || x.department.admission?.[track])
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
