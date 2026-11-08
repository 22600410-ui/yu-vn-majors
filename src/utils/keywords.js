import data from '../data/keywords.json';

const toLocalized = ([ko, vi]) => ({ ko, vi });

/** 카드·상세에 보이는 핵심 해시태그 2개 [{ko, vi}] (키워드 파일에 없으면 빈 배열) */
export function tagsOf(department) {
  return (data[department.name.ko]?.tags ?? []).map(toLocalized);
}

/** 검색용 비슷한 말 (화면에는 표시하지 않음) */
export function aliasesOf(department) {
  return data[department.name.ko]?.aliases ?? [];
}
