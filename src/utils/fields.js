import config from '../data/fields.json';
import images from '../data/images.json';

export const FIELDS = config.fields;

/** 학과의 계열 객체 (overrides → 단과대학 기본값) */
export function fieldOf(department, college) {
  const id = config.overrides[department.name.ko] ?? FIELDS.find((f) => f.colleges.includes(college.id))?.id;
  return FIELDS.find((f) => f.id === id) ?? null;
}

/** 학과 대표 이미지 URL (images.json 에 등록된 경우만) */
export function imageOf(department) {
  const file = images[department.id];
  return file ? `${import.meta.env.BASE_URL}images/departments/${file}` : null;
}

/** 카드용 한 줄 설명: 한 줄 소개 → 학과 소개 첫 문장 → 전공 안내 첫 문장 */
export function summaryOf(department) {
  if (department.slogan?.ko) return department.slogan;
  const src = department.description?.ko ? department.description : department.majorGuide;
  if (!src?.ko) return null;
  const firstSentence = (s) => (s ? s.split(/(?<=[.!?。])\s|\n/)[0] : s);
  return Object.fromEntries(Object.entries(src).map(([k, v]) => [k, firstSentence(v)]));
}
