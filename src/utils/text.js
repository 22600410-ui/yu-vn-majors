/*
 * 수집한 학과 글 다듬기 (화면 표시용)
 * 영남대 홈페이지 원문에는 문장 중간 줄바꿈("그것을\n통해")이 섞여 있어 그대로 보이면 줄이 들쭉날쭉합니다.
 * - tidy: 문장 중간 줄바꿈은 띄어쓰기로 이어 붙이고, 목록 기호(- · • # ※ ▶ 1.)로 시작하는 줄만 줄바꿈 유지
 * - titleAndBody: "짧은 제목\n설명…" 형태면 제목과 내용으로 나눔 (특성화 프로그램·자격증)
 * - dedupeLocalized: 다른 항목에 그대로 들어 있는 항목(중복 수집)을 뺌
 */

const LIST_MARK = /^([-·•#※▶◦○●]|\d+[.)]\s|[①-⑳])/;
const SENTENCE_END = /[.!?。…:：]$/;

export function tidy(text = '') {
  if (!text) return '';
  const lines = String(text)
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  let out = '';
  for (const line of lines) {
    if (!out) out = line;
    else out += LIST_MARK.test(line) ? `\n${line}` : ` ${line}`;
  }
  return out;
}

export function titleAndBody(text = '') {
  const lines = String(text)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length >= 2 && lines[0].length <= 40 && !SENTENCE_END.test(lines[0]) && !LIST_MARK.test(lines[0])) {
    return { title: lines[0], body: tidy(lines.slice(1).join('\n')) };
  }
  return { title: '', body: tidy(text) };
}

/** LocalizedText({ko, vi, …})의 모든 언어 값에 함수 적용 */
export function mapLocalized(loc, fn) {
  if (!loc) return loc;
  if (typeof loc === 'string') return fn(loc);
  return Object.fromEntries(Object.entries(loc).map(([k, v]) => [k, v ? fn(v) : v]));
}

/** 원문(ko) 기준으로 다른 항목 안에 통째로 들어 있는 항목을 제거 */
export function dedupeLocalized(items = [], pick = (x) => x) {
  const norm = (x) => tidy(pick(x)?.ko ?? '').replace(/\s/g, '');
  const keys = items.map(norm);
  return items.filter((_, i) => {
    const k = keys[i];
    if (!k) return false;
    return !keys.some((other, j) => j !== i && other.length > k.length && other.includes(k)) && keys.indexOf(k) === i;
  });
}
