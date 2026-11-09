import { useSyncExternalStore } from 'react';

/**
 * 학생 브라우저에만 저장되는 작은 저장소 (로그인 없음)
 * - 관심 학과(♡) 목록, 지원 준비 체크리스트 체크 상태 등에 사용
 * - 저장이 막힌 브라우저(사생활 보호 모드 등)에서도 화면은 정상 동작 (이번 방문 동안만 기억)
 */
function createStore(key, initial) {
  let value = initial;
  try {
    const raw = localStorage.getItem(key);
    if (raw) value = JSON.parse(raw);
  } catch {
    /* 저장소를 쓸 수 없으면 기본값 사용 */
  }
  const listeners = new Set();
  const set = (next) => {
    value = typeof next === 'function' ? next(value) : next;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* 저장 실패는 무시 */
    }
    listeners.forEach((l) => l());
  };
  const subscribe = (l) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  // 다른 탭에서 바꾼 내용도 반영
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== key) return;
      try {
        value = e.newValue ? JSON.parse(e.newValue) : initial;
      } catch {
        value = initial;
      }
      listeners.forEach((l) => l());
    });
  }
  return { get: () => value, set, subscribe };
}

/* ---------------- 관심 학과 ---------------- */
export const MAX_COMPARE = 3;
const savedStore = createStore('yu-saved-departments', []);

/** 저장한 학과 id 목록과 토글 함수 */
export function useSaved() {
  const ids = useSyncExternalStore(savedStore.subscribe, savedStore.get);
  const toggle = (id) => savedStore.set((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const remove = (id) => savedStore.set((cur) => cur.filter((x) => x !== id));
  const clear = () => savedStore.set([]);
  return { ids, isSaved: (id) => ids.includes(id), toggle, remove, clear };
}

/* ---------------- 지원 준비 체크리스트 ---------------- */
const checklistStore = createStore('yu-checklist', { track: 'freshman', checked: {} });

export function useChecklistState() {
  const state = useSyncExternalStore(checklistStore.subscribe, checklistStore.get);
  const setTrack = (track) => checklistStore.set((s) => ({ ...s, track }));
  const toggle = (id) => checklistStore.set((s) => ({ ...s, checked: { ...s.checked, [id]: !s.checked[id] } }));
  const reset = (ids) =>
    checklistStore.set((s) => {
      const checked = { ...s.checked };
      ids.forEach((id) => delete checked[id]);
      return { ...s, checked };
    });
  return { track: state.track ?? 'freshman', checked: state.checked ?? {}, setTrack, toggle, reset };
}
