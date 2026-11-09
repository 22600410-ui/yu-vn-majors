import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { findDepartment, useDepartments } from '../hooks/useDepartments';
import LocalizedText from '../components/LocalizedText';
import { tr } from '../utils/localize';
import { LEVELS, TUITION, simulate, tuitionGroupOf, won } from '../utils/tuition';

function Step({ n, title, children }) {
  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yu-dark text-sm text-white">{n}</span>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({ label, value, sub, strong = false, minus = false }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className={strong ? 'font-bold text-slate-900' : 'text-slate-700'}>{label}</p>
        {sub && <p className="text-xs leading-snug text-slate-500">{sub}</p>}
      </div>
      <p className={`shrink-0 text-right tabular-nums ${minus ? 'font-bold text-rose-600' : strong ? 'font-bold text-slate-900' : 'text-slate-800'}`}>
        {minus && '− '}
        {value}
      </p>
    </div>
  );
}

export default function Tuition() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const { data, loading } = useDepartments();
  const [params, setParams] = useSearchParams();
  const deptId = params.get('dept') ?? '';
  const [level, setLevel] = useState('none');
  const [yuBonus, setYuBonus] = useState(false);

  const found = useMemo(() => (deptId ? findDepartment(data, deptId) : null), [data, deptId]);
  const info = found ? tuitionGroupOf(found.department, found.college) : null;
  const result = info ? simulate(info.group, level, yuBonus) : null;

  if (loading) return <p className="p-8 text-center">{t('common.loading')}</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-8">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{t('tuition.title')}</h1>
      <p className="mt-2 text-[15px] text-slate-600">{t('tuition.intro')}</p>

      {/* ① 학과 고르기 */}
      <Step n={1} title={t('tuition.step1')}>
        <select
          value={deptId}
          onChange={(e) => setParams(e.target.value ? { dept: e.target.value } : {}, { replace: true })}
          className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 text-[16px] text-slate-900 focus:border-yu-dark focus:outline-none"
        >
          <option value="">{t('tuition.choose')}</option>
          {(data?.colleges ?? []).map((c) => (
            <optgroup key={c.id} label={tr(c.name, lang)}>
              {c.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {tr(d.name, lang)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {info && (
          <p className="mt-2 text-sm text-slate-600">
            {t('tuition.group')}: <LocalizedText text={info.group.label} className="font-bold text-slate-900" showBadge={false} />
            {info.estimated && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">{t('tuition.estimated')}</span>}
          </p>
        )}
      </Step>

      {/* ② 한국어 능력 */}
      <Step n={2} title={t('tuition.step2')}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {LEVELS.map((l) => (
            <label
              key={l.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition ${
                level === l.id ? 'border-yu-dark bg-yu-light' : 'border-slate-200 bg-white hover:border-yu-dark'
              }`}
            >
              <input type="radio" name="level" value={l.id} checked={level === l.id} onChange={() => setLevel(l.id)} className="h-5 w-5 shrink-0 accent-[#003B73]" />
              <span className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-slate-900">
                <LocalizedText text={l.label} showBadge={false} />
              </span>
              <span className={`shrink-0 text-sm font-bold ${l.rate ? 'text-emerald-700' : 'text-slate-400'}`}>{l.rate}%</span>
            </label>
          ))}
        </div>
        <label className={`mt-3 flex items-start gap-3 rounded-xl bg-slate-50 p-4 ${level === 'none' ? 'opacity-50' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={yuBonus && level !== 'none'}
            disabled={level === 'none'}
            onChange={(e) => setYuBonus(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#003B73]"
          />
          <span className="min-w-0 text-[15px] leading-snug">
            <span className="block font-semibold text-slate-900">{t('tuition.bonusLabel')}</span>
            <span className="mt-0.5 block text-sm text-slate-600">{t('tuition.bonusText')}</span>
          </span>
        </label>
      </Step>

      {/* 결과 */}
      <section className="mt-10">
        {!result ? (
          <p className="rounded-2xl bg-slate-50 p-6 text-center text-[15px] text-slate-600">{t('tuition.needDept')}</p>
        ) : (
          <div className="overflow-hidden rounded-3xl border-2 border-yu-dark">
            <div className="bg-yu-dark px-5 py-4 text-white">
              <p className="text-sm text-white/80">{tr(found.college.name, lang)}</p>
              <p className="text-xl font-extrabold">{tr(found.department.name, lang)}</p>
            </div>
            <div className="divide-y divide-slate-100 px-5 py-3 text-[15px]">
              <Row label={t('tuition.firstFee')} value={won(result.first, lang)} sub={t('tuition.firstFeeSub', { tuition: won(result.tuition, lang), extra: won(result.extra, lang) })} />
              {result.rate > 0 ? (
                <Row
                  label={`${tr(result.scholarshipName, lang)} · ${t('tuition.exempt', { rate: result.rate })}`}
                  value={won(result.discount, lang)}
                  sub={result.bonusApplied ? t('tuition.bonusApplied') : null}
                  minus
                />
              ) : (
                <Row label={t('tuition.noScholarship')} value={won(0, lang)} />
              )}
              <div className="flex items-end justify-between gap-3 py-4">
                <p className="font-extrabold text-slate-900">{t('tuition.payFirst')}</p>
                <p className="text-right text-2xl font-extrabold tabular-nums text-yu-dark sm:text-3xl">{won(result.pay, lang)}</p>
              </div>
              <Row label={t('tuition.later')} value={won(result.later, lang)} sub={t('tuition.laterSub')} />
            </div>
            {result.conditional && (
              <p className="border-t border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">{t('tuition.conditional')}</p>
            )}
          </div>
        )}
      </section>

      {/* 계열별 등록금 표 */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-yu-dark">
          {t('tuition.tableTitle')} <LocalizedText text={TUITION.basis} className="text-sm font-normal text-slate-500" showBadge={false} />
        </h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 sm:text-sm">
            <span>{t('tuition.colGroup')}</span>
            <span className="text-right">{t('tuition.colFirst')}</span>
            <span className="text-right">{t('tuition.colLater')}</span>
          </div>
          {TUITION.groups.map((g) => (
            <div
              key={g.id}
              className={`grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 border-t border-slate-100 px-3 py-2.5 text-[13px] sm:text-[15px] ${
                info?.group.id === g.id ? 'bg-yu-light font-bold' : ''
              }`}
            >
              <LocalizedText text={g.label} showBadge={false} className="min-w-0 leading-snug" />
              <span className="text-right tabular-nums">{g.first.toLocaleString('ko-KR')}</span>
              <span className="text-right tabular-nums">{g.later.toLocaleString('ko-KR')}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 안내 문구 */}
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-[15px] leading-relaxed text-amber-950">
        <p className="font-bold">⚠ {t('tuition.disclaimerTitle')}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{t('tuition.disclaimer1')}</li>
          <li>{t('tuition.disclaimer2')}</li>
          <li>{t('tuition.disclaimer3')}</li>
          <li>{t('tuition.disclaimer4')}</li>
        </ul>
        <Link to="/checklist" className="mt-3 inline-block font-semibold text-amber-900 underline">
          {t('nav.checklist')} →
        </Link>
      </div>
    </div>
  );
}
