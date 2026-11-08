import { useEffect, useState } from 'react';

// public/data/departments.json — BASE_URL을 붙여야 GitHub Pages 하위 경로에서도 동작합니다.
const DATA_URL = `${import.meta.env.BASE_URL}data/departments.json`;

let cache = null;

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
        cache = json;
        setState({ data: json, loading: false, error: null });
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
