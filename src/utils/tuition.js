import data from '../data/tuition.json';

export const TUITION = data;
export const LEVELS = data.scholarship.levels;

/** 학과의 등록금 계열 { group, estimated } */
export function tuitionGroupOf(department, college) {
  const id = data.departments[department.name.ko] ?? data.colleges[college.id] ?? 'humanities';
  return {
    group: data.groups.find((g) => g.id === id),
    estimated: data.estimated.includes(department.name.ko),
  };
}

/** 면제 비율에 해당하는 장학금 이름 */
const nameOfRate = (rate) => LEVELS.find((l) => l.rate === rate)?.name ?? null;

/**
 * 첫 학기 장학금·납부액 모의 계산
 * - 장학금은 '수업료' 면제이고 첫 학기만 적용
 * - 첫 학기 금액 중 둘째 학기 금액과의 차이(첫 학기에만 더 내는 금액)는 수업료 외 납부금으로 보고 면제에서 제외
 * - yuBonus: 영남대 한국어·국제언어교육원 1년 이상 이수 + TOPIK 3급 수준 인정 → 한 단계 위 혜택
 */
export function simulate(group, levelId, yuBonus = false) {
  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[LEVELS.length - 1];
  let rate = level.rate;
  let bonusApplied = false;
  if (yuBonus && rate > 0) {
    const steps = data.scholarship.steps;
    const i = steps.indexOf(rate);
    if (i >= 0 && i < steps.length - 1) {
      rate = steps[i + 1];
      bonusApplied = true;
    }
  }
  const tuition = group.later; // 수업료
  const extra = group.first - group.later; // 첫 학기에만 더 내는 금액
  const discount = Math.round((tuition * rate) / 100);
  return {
    level,
    rate,
    bonusApplied,
    scholarshipName: nameOfRate(rate),
    conditional: !!level.conditional,
    first: group.first,
    tuition,
    extra,
    discount,
    pay: group.first - discount,
    later: group.later,
  };
}

/** 원화 표시 (언어별 숫자 형식) */
export const won = (n, lang) => `${Number(n).toLocaleString(lang === 'ko' ? 'ko-KR' : lang)}${lang === 'ko' ? '원' : ' KRW'}`;
