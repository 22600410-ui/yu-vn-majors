import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDepartments } from '../hooks/useDepartments';
import { normalizeQuery, searchableText } from '../utils/localize';
import DepartmentCard from '../components/DepartmentCard';
import LocalizedText from '../components/LocalizedText';

export default function Home() {
  const { t } = useTranslation();
  const { data, loading, error } = useDepartments();
  const [query, setQuery] = useState('');
  const [track, setTrack] = useState('all'); // all | freshman | transfer

  const colleges = useMemo(() => {
    if (!data) return [];
    const q = normalizeQuery(query);
    return data.colleges
      .map((c) => ({
        ...c,
        departments: c.departments.filter(
          (d) =>
            (track === 'all' || d.admission?.[track]) &&
            (!q || searchableText(c.name, d.name, d.tags, d.majors.map((m) => m.name)).includes(q)),
        ),
      }))
      .filter((c) => c.departments.length > 0);
  }, [data, query, track]);

  const admissionMeta = data?.meta?.admission;

  if (loading) return <p className="p-8 text-center">{t('common.loading')}</p>;
  if (error) return <p className="p-8 text-center text-red-600">{t('common.error')}</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('search.placeholder')}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-yu focus:outline-none"
      />

      {admissionMeta && (
        <>
          <div role="tablist" aria-label={t('admission.filterLabel')} className="mt-4 flex flex-wrap gap-2">
            {['all', 'freshman', 'transfer'].map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={track === k}
                onClick={() => setTrack(k)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  track === k ? 'border-yu bg-yu text-white' : 'border-slate-300 text-slate-700 hover:border-yu'
                }`}
              >
                {t(`admission.${k}`)}
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-500">
            <LocalizedText text={admissionMeta.year} showBadge={false} /> · {t('admission.basis')}
            {admissionMeta.notes?.map((n) => (
              <LocalizedText key={n.ko} as="p" text={n} className="mt-1" showBadge={false} />
            ))}
          </div>
        </>
      )}

      {colleges.length === 0 && <p className="mt-8 text-center text-slate-500">{t('search.noResult')}</p>}

      {colleges.map((c) => (
        <section key={c.id} className="mt-10">
          <div className="flex items-baseline justify-between gap-4">
            <LocalizedText as="h2" text={c.name} className="text-xl font-bold text-yu-dark" />
            <span className="text-sm text-slate-500">
              {t('college.departmentCount', { count: c.departments.length })}
            </span>
          </div>
          <LocalizedText as="p" text={c.description} className="mt-1 text-sm text-slate-600" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.departments.map((d) => (
              <DepartmentCard key={d.id} department={d} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
