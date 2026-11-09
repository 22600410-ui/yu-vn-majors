import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDepartments } from '../hooks/useDepartments';
import { searchDepartments } from '../utils/search';
import { tr } from '../utils/localize';
import MajorCard from '../components/MajorCard';
import LocalizedText from '../components/LocalizedText';

const TRACKS = ['all', 'freshman', 'transfer'];

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`max-w-full rounded-full border-2 px-3.5 py-1.5 text-left text-sm leading-snug transition ${
        active
          ? 'border-yu-dark bg-yu-dark font-bold text-white ring-2 ring-yu-dark/25'
          : 'border-slate-200 bg-white text-slate-700 hover:border-yu-dark'
      }`}
    >
      {children}
    </button>
  );
}

/** "비슷한 학과" 카드 위에 붙는 이유 한 줄 */
function SimilarReason({ reason }) {
  const { t, i18n } = useTranslation();
  const label =
    reason.type === 'text' ? t('search.reasonText') : t(`search.reason_${reason.type}`, { label: tr(reason.item.label, i18n.resolvedLanguage) });
  return <p className="mb-1.5 truncate text-[13px] font-medium text-slate-500">↳ {label}</p>;
}

export default function Departments() {
  const { t, i18n } = useTranslation();
  const { data, loading, error } = useDepartments();
  const lang = i18n.resolvedLanguage;

  // 검색어·필터를 주소(#/departments?college=eng&track=freshman&q=...)에 담아 공유·뒤로가기 가능
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const track = TRACKS.includes(params.get('track')) ? params.get('track') : 'all';
  const collegeId = params.get('college') ?? 'all';
  const update = (key, value, empty) => {
    const next = new URLSearchParams(params);
    if (!value || value === empty) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const passes = (x) => (track === 'all' || x.department.admission?.[track]) && (collegeId === 'all' || x.college.id === collegeId);

  // 검색어가 있으면: 가장 정확한 학과 + 비슷한 학과
  const result = useMemo(() => {
    if (!data || !query.trim()) return null;
    const r = searchDepartments(data, query);
    return { best: r.best.filter(passes), similar: r.similar.filter(passes) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, query, track, collegeId]);

  // 검색어가 없으면: 단과대학별 목록
  const colleges = useMemo(() => {
    if (!data) return [];
    return data.colleges
      .map((college) => ({ ...college, departments: college.departments.filter((department) => passes({ department, college })) }))
      .filter((c) => c.departments.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, track, collegeId]);

  if (loading) return <p className="p-8 text-center">{t('common.loading')}</p>;
  if (error) return <p className="p-8 text-center text-red-600">{t('common.error')}</p>;

  const total = result ? result.best.length : colleges.reduce((n, c) => n + c.departments.length, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{t('departments.title')}</h1>
      <p className="mt-1 text-[15px] text-slate-600">{t('departments.intro')}</p>

      <input
        type="search"
        value={query}
        onChange={(e) => update('q', e.target.value, '')}
        placeholder={t('search.placeholder')}
        className="mt-5 w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-base focus:border-yu focus:outline-none"
      />

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-full shrink-0 text-sm font-semibold text-slate-600 sm:w-20">{t('admission.filterLabel')}</span>
          {TRACKS.map((k) => (
            <Chip key={k} active={track === k} onClick={() => update('track', k, 'all')}>
              {t(`admission.${k}`)}
            </Chip>
          ))}
        </div>
        {/* 휴대폰: 제목 아래에 버튼 / 넓은 화면: 제목 옆에 버튼 */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <span className="shrink-0 text-sm font-semibold text-slate-600 sm:w-20 sm:pt-1.5">{t('departments.collegeFilter')}</span>
          <div className="flex flex-wrap gap-2">
            <Chip active={collegeId === 'all'} onClick={() => update('college', 'all', 'all')}>
              {t('departments.allColleges')}
            </Chip>
            {data.colleges.map((c) => (
              <Chip key={c.id} active={collegeId === c.id} onClick={() => update('college', c.id, 'all')}>
                {tr(c.name, lang)}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {result ? (
        <>
          {/* 가장 정확한 학과 */}
          <section className="mt-8">
            <h2 className="text-xl font-extrabold text-slate-900">
              {t('search.bestTitle', { q: query })} <span className="text-base font-semibold text-slate-500">{result.best.length}</span>
            </h2>
            {result.best.length === 0 ? (
              <p className="mt-4 text-[15px] text-slate-600">{t('search.noResult')}</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {result.best.map(({ department, college, hits }, i) => (
                  <div key={department.id} className="flex flex-col">
                    {hits.length > 0 && (
                      <p className="mb-1.5 truncate text-[13px] font-semibold text-yu">
                        ✓ {t('search.matched')}: {hits.slice(0, 2).join(', ')}
                      </p>
                    )}
                    <div className="flex-1">
                      <MajorCard department={department} college={college} index={i} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 비슷한 학과 */}
          {result.similar.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-extrabold text-slate-900">{t('search.similarTitle')}</h2>
              <p className="mt-1 text-[15px] text-slate-600">{t('search.similarIntro')}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {result.similar.map(({ department, college, reason }, i) => (
                  <div key={department.id} className="flex flex-col">
                    <SimilarReason reason={reason} />
                    <div className="flex-1">
                      <MajorCard department={department} college={college} index={i} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          <p className="mt-6 text-sm text-slate-600">{t('departments.resultCount', { count: total })}</p>
          {total === 0 && <p className="mt-8 text-center text-slate-600">{t('search.noResult')}</p>}
          {colleges.map((c) => (
            <section key={c.id} className="mt-10">
              <div className="flex items-baseline justify-between gap-4 border-b pb-2">
                <LocalizedText as="h2" text={c.name} className="text-xl font-extrabold text-slate-900" />
                <span className="shrink-0 text-sm text-slate-500">{t('college.departmentCount', { count: c.departments.length })}</span>
              </div>
              <LocalizedText as="p" text={c.description} className="mt-2 text-[15px] text-slate-600" />
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {c.departments.map((d, i) => (
                  <MajorCard key={d.id} department={d} college={c} index={i} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
