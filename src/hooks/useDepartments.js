import { useEffect, useState } from 'react';
import manual from '../data/manual-content.json';

// public/data/departments.json — BASE_URL을 붙여야 GitHub Pages 하위 경로에서도 동작합니다.
const DATA_URL = `${import.meta.env.BASE_URL}data/departments.json`;

let cache = null;

/** 수집 데이터의 빈칸(소개·한 줄 소개·링크)을 src/data/manual-content.json 으로 채움 */
function applyManualContent(json) {
  for (const college of json.colleges ?? []) {
    for (const d of college.departments) {
      const m = manual[d.name.ko];
      if (!m) continue;
      if (!d.slogan?.ko && m.slogan) d.slogan = m.slogan;
      if (!d.description?.ko && m.description) d.description = m.description;
      if (m.links) {
        d.links = { ...d.links };
        for (const [k, v] of Object.entries(m.links)) if (!d.links[k]) d.links[k] = v;
      }
    }
  }
  return json;
}

export function useDepartments() {
  const [state, setState] = useState({ data: cache, loading: !cache, error: null });

  useEffect(() => {
    if (cache) return;
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        cache = cache ?? applyManualContent(json);
        setState({ data: cache, loading: false, error: null });
      })
      .catch((error) => setState({ data: null, loading: false, error }));
  }, []);

  return state;
}

export function findDepartment(data, id) {
  for (const c of data?.colleges ?? []) {
    const d = c.departments.find((x) => x.id === id);
    if (d) return { college: c, department: d };
  }
  return null;
}
