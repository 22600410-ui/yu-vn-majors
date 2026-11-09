import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { findDepartment, useDepartments } from '../hooks/useDepartments';
import { MAX_COMPARE, useSaved } from '../utils/saved';
import { imageOf, imagePositionOf, summaryOf } from '../utils/fields';
import { dedupeLocalized, mapLocalized, tidy, titleAndBody } from '../utils/text';
import { tr } from '../utils/localize';
import LocalizedText from '../components/LocalizedText';
import AdmissionBadges from '../components/AdmissionBadges';
import CoreTags from '../components/CoreTags';
import KoreanLevel from '../components/KoreanLevel';

const MAX_LIST = 5; // 비교표 칸마다 보여 줄 최대 항목 수

/** 비교표 한 칸 안의 짧은 목록 */
function ShortList({ items, empty }) {
  if (!items.length) return <p className="text-sm text-slate-400">{empty}</p>;
  return (
    <ul className="space-y-1.5 text-sm leading-snug text-slate-800">
      {items.slice(0, MAX_LIST).map((x, i) => (
        <li key={i} className="flex gap-1.5">
          <span aria-hidden className="text-slate-400">·</span>
          <LocalizedText text={x} showBadge={false} className="min-w-0" />
        </li>
      ))}
      {items.length > MAX_LIST && <li className="pl-3 text-xs text-slate-500">+{items.length - MAX_LIST}</li>}
    </ul>
  );
}

const careersOf = (d) =>
  (d.careers ?? []).map((c) => mapLocalized(c.category?.ko ? c.category : c.detail, tidy)).filter((x) => x?.ko);
const certificatesOf = (d) => dedupeLocalized(d.certificates ?? []).map((c) => mapLocalized(c, (s) => titleAndBody(s).title || tidy(s)));

/** 2~3개 학과를 나란히 놓은 비교표 (휴대폰에서는 표 안에서만 옆으로 밀어 봄) */
function CompareTable({ items }) {
  const { t } = useTranslation();
  // 칸 하나 최소 9.5rem → 휴대폰에서 3개면 표가 화면보다 넓어지고, 표 상자 안에서만 옆으로 밀림
  const cols = { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, minWidth: `${items.length * 10.5}rem` };
  const full = { gridColumn: '1 / -1' };

  const rows = [
    { key: 'admission', label: t('compare.admission'), render: (x) => <AdmissionBadges admission={x.department.admission} /> },
    { key: 'tags', label: t('compare.tags'), render: (x) => <CoreTags department={x.department} /> },
    {
      key: 'summary',
      label: t('compare.summary'),
      render: (x) => <LocalizedText as="p" text={summaryOf(x.department)} className="text-sm leading-relaxed text-slate-800" showBadge={false} />,
    },
    { key: 'korean', label: t('compare.korean'), render: (x) => <KoreanLevel department={x.department} variant="compact" /> },
    { key: 'careers', label: t('department.careers'), render: (x) => <ShortList items={careersOf(x.department)} empty={t('compare.none')} /> },
    { key: 'certs', label: t('department.certificates'), render: (x) => <ShortList items={certificatesOf(x.department)} empty={t('compare.none')} /> },
  ];

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="grid gap-x-3 rounded-2xl border border-slate-200 bg-white p-3 sm:gap-x-5 sm:p-5" style={cols}>
        {/* 머리: 사진 + 학과 이름 */}
        {items.map(({ department: d, college }) => {
          const photo = imageOf(d);
          return (
            <Link key={d.id} to={`/department/${d.id}`} className="group block min-w-0">
              {photo && (
                <img src={photo} alt="" className="aspect-[16/10] w-full rounded-xl object-cover" style={{ objectPosition: imagePositionOf(d) }} />
              )}
              <LocalizedText as="p" text={college.name} className="mt-2 text-xs text-slate-500" showBadge={false} />
              <LocalizedText as="p" text={d.name} className="text-[16px] font-extrabold leading-snug text-slate-900 group-hover:text-yu" showBadge={false} />
            </Link>
          );
        })}

        {rows.map((row) => (
          <div key={row.key} className="contents">
            <p className="mb-2 mt-5 border-t border-slate-100 pt-3 text-[13px] font-bold text-yu-dark" style={full}>
              {row.label}
            </p>
            {items.map((x) => (
              <div key={x.department.id} className="min-w-0">
                {row.render(x)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Saved() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const { data, loading } = useDepartments();
  const { ids, remove, clear } = useSaved();

  // 저장한 학과 (저장 순서 유지, 사라진 학과는 건너뜀)
  const saved = useMemo(() => ids.map((id) => findDepartment(data, id)).filter(Boolean), [data, ids]);

  // 비교할 학과: 처음에는 저장한 순서대로 앞의 3개
  const [picked, setPicked] = useState(null);
  const selected = (picked ?? ids.slice(0, MAX_COMPARE)).filter((id) => ids.includes(id));
  useEffect(() => {
    if (picked) setPicked((cur) => cur.filter((id) => ids.includes(id)));
  }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePick = (id) => {
    const cur = selected;
    if (cur.includes(id)) setPicked(cur.filter((x) => x !== id));
    else if (cur.length < MAX_COMPARE) setPicked([...cur, id]);
  };
  const compareItems = saved.filter((x) => selected.includes(x.department.id));

  if (loading) return <p className="p-8 text-center">{t('common.loading')}</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{t('saved.title')}</h1>
      <p className="mt-2 text-[15px] text-slate-600">{t('saved.intro', { max: MAX_COMPARE })}</p>

      {saved.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-rose-50 p-8 text-center">
          <p className="text-5xl" aria-hidden>♡</p>
          <p className="mt-3 text-lg font-bold text-slate-900">{t('saved.emptyTitle')}</p>
          <p className="mt-1 text-[15px] text-slate-700">{t('saved.emptyText')}</p>
          <Link to="/departments" className="mt-5 inline-block rounded-2xl bg-yu-dark px-6 py-3 font-bold text-white hover:bg-yu">
            {t('nav.departments')} →
          </Link>
        </div>
      ) : (
        <>
          {/* 저장한 학과 목록: 비교할 학과 고르기 */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              {t('saved.listTitle')} <span className="text-rose-500">{saved.length}</span>
            </h2>
            <button type="button" onClick={clear} className="text-sm font-semibold text-slate-500 underline hover:text-slate-800">
              {t('saved.clear')}
            </button>
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map(({ department: d }) => {
              const on = selected.includes(d.id);
              const full = !on && selected.length >= MAX_COMPARE;
              return (
                <li
                  key={d.id}
                  className={`flex min-w-0 items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition ${on ? 'border-yu-dark bg-yu-light' : 'border-slate-200 bg-white'}`}
                >
                  <label className={`flex min-w-0 flex-1 items-center gap-3 ${full ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={full}
                      onChange={() => togglePick(d.id)}
                      className="h-5 w-5 shrink-0 accent-[#003B73]"
                    />
                    <span className="min-w-0 text-[15px] font-semibold leading-snug text-slate-900">{tr(d.name, lang)}</span>
                  </label>
                  <Link to={`/department/${d.id}`} className="shrink-0 text-sm font-semibold text-yu hover:underline">
                    {t('saved.open')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(d.id)}
                    aria-label={t('saved.remove')}
                    title={t('saved.remove')}
                    className="shrink-0 rounded-full px-1.5 text-lg leading-none text-slate-400 hover:text-rose-500"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>

          {/* 비교표 */}
          <section className="mt-10">
            <h2 className="text-xl font-extrabold text-slate-900">{t('compare.title')}</h2>
            {compareItems.length < 2 ? (
              <p className="mt-3 rounded-xl bg-slate-50 p-4 text-[15px] text-slate-600">{t('compare.needTwo')}</p>
            ) : (
              <>
                <p className="mt-1 text-sm text-slate-500 sm:hidden">{t('compare.swipe')}</p>
                <div className="mt-4">
                  <CompareTable items={compareItems} />
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
