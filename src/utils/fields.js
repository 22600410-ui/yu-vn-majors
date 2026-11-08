import config from '../data/fields.json';
import images from '../data/images.json';

export const FIELDS = config.fields;

/** 학과의 계열 객체 (overrides → 단과대학 기본값) */
export function fieldOf(department, college) {
  const id = config.overrides[department.name.ko] ?? FIELDS.find((f) => f.colleges.includes(college.id))?.id;
  return FIELDS.find((f) => f.id === id) ?? null;
}

// src/assets/departments/<학과 이름>.(jpg|jpeg|png|webp|gif) 를 자동으로 모두 불러옴.
// 파일 이름만 학과 이름으로 맞추면 등록 작업 없이 카드·미리보기·상세 페이지에 나옵니다.
// ("학과"/"학부" 끝말이 달라도 찾음: 파이버시스템공학부.jpg → 파이버시스템공학과)
const photoFiles = import.meta.glob('../assets/departments/*.{jpg,jpeg,png,webp,gif,JPG,JPEG,PNG}', {
  eager: true,
  query: '?url',
  import: 'default',
});
const stem = (s) => s.normalize('NFC').replace(/(학과|학부)$/, '');
const photoByStem = new Map(
  Object.entries(photoFiles).map(([path, url]) => [stem(decodeURIComponent(path.split('/').pop()).replace(/\.[^.]+$/, '')), url]),
);

/** 학과 대표 사진 URL: src/assets/departments 자동 매칭 → images.json(public/images/departments) 순 */
export function imageOf(department) {
  const auto = photoByStem.get(stem(department.name.ko));
  if (auto) return auto;
  const file = images[department.id];
  return file ? `${import.meta.env.BASE_URL}images/departments/${file}` : null;
}

/** 사진에서 보여 줄 위치 (가로로 긴 배너 사진용, 기본은 가운데). images.json 의 positions */
export function imagePositionOf(department) {
  return images.positions?.[department.name.ko] ?? 'center';
}

/** 카드용 한 줄 설명: 한 줄 소개 → 학과 소개 첫 문장 → 전공 안내 첫 문장 */
export function summaryOf(department) {
  if (department.slogan?.ko) return department.slogan;
  const src = department.description?.ko ? department.description : department.majorGuide;
  if (!src?.ko) return null;
  const firstSentence = (s) => (s ? s.split(/(?<=[.!?。])\s|\n/)[0] : s);
  return Object.fromEntries(Object.entries(src).map(([k, v]) => [k, firstSentence(v)]));
}
