import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LocalizedText from '../components/LocalizedText';
import DdayBanner from '../components/DdayBanner';
import { tr } from '../utils/localize';
import { CURRENCIES, convert, defaultCurrency, won } from '../utils/tuition';
import GRAD from '../data/graduate.json';

/* ---------------- 데이터 도우미 ---------------- */
const ALL = GRAD.fields.flatMap((f) => f.departments.map((d) => ({ ...d, field: f.id })));
const langsOf = (d) => d.lang ?? [];
const isEnTrack = (d) => langsOf(d).includes('entrack');
const hasEnglish = (d) => isEnTrack(d) || langsOf(d).includes('en');
const isKoreanOnly = (d) => langsOf(d).length === 0;
const hasOther = (d) => langsOf(d).some((l) => l === 'zh' || l === 'ja');

const LANG_FILTERS = [
  { id: 'all', test: () => true },
  { id: 'entrack', test: isEnTrack },
  { id: 'en', test: hasEnglish },
  { id: 'ko', test: isKoreanOnly },
  { id: 'other', test: hasOther },
];
const DEGREE_FILTERS = [
  { id: 'all', test: () => true },
  { id: 'M', test: (d) => d.new.includes('M') },
  { id: 'D', test: (d) => d.new.includes('D') || d.new.includes('I') },
  { id: 'tr', test: (d) => !!d.tr },
];

/** 신입학 학위과정 → 등록금 기준(석사 / 박사·석박사통합) */
const degreesOf = (d, track) => {
  const s = track === 'tr' ? d.tr : d.new;
  const out = [];
  if (s.includes('M')) out.push('M');
  if (s.includes('D') || s.includes('I')) out.push('D');
  return out;
};
const feeGroupOf = (d) => GRAD.tuition.groups.find((g) => g.id === (d.fee ?? GRAD.tuition.fieldDefault[d.field] ?? 'hum'));

/* ---------------- 작은 부품 ---------------- */
const BADGE = {
  entrack: 'bg-indigo-600 text-white',
  en: 'bg-sky-100 text-sky-800',
  zh: 'bg-rose-100 text-rose-800',
  ja: 'bg-amber-100 text-amber-800',
  ko: 'bg-slate-100 text-slate-700',
};

function LangBadges({ d }) {
  const { t } = useTranslation();
  const list = isKoreanOnly(d) ? ['ko'] : langsOf(d);
  return (
    <span className="flex flex-wrap gap-1.5">
      {list.map((l) => (
        <span key={l} className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${BADGE[l]}`}>
          {t(`grad.lang.${l}`)}
        </span>
      ))}
    </span>
  );
}

function DegreePills({ value }) {
  const { t } = useTranslation();
  if (!value) return <span className="text-sm text-slate-400">{t('grad.none')}</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {['M', 'D', 'I'].filter((k) => value.includes(k)).map((k) => (
        <span key={k} className="rounded-md border border-yu/30 bg-yu-light px-2 py-0.5 text-xs font-bold text-yu-dark">
          {t(`grad.degree.${k}`)}
        </span>
      ))}
    </span>
  );
}

function GradCard({ d, onCalc }) {
  const { t } = useTranslation();
  return (
    <article className={`flex flex-col rounded-2xl border-2 bg-white p-4 shadow-sm ${isEnTrack(d) ? 'border-indigo-300' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <LocalizedText as="h3" text={d.name} className="min-w-0 text-[17px] font-extrabold leading-snug text-slate-900" />
      </div>
      <div className="mt-2">
        <LangBadges d={d} />
      </div>
      <LocalizedText as="p" text={d.majors} className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600" showBadge={false} />
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <dt className="w-14 shrink-0 font-semibold text-slate-500">{t('grad.newShort')}</dt>
          <dd><DegreePills value={d.new} /></dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="w-14 shrink-0 font-semibold text-slate-500">{t('grad.trShort')}</dt>
          <dd><DegreePills value={d.tr} /></dd>
        </div>
      </dl>
      {d.alt && <p className="mt-2 text-xs font-semibold text-emerald-700">✓ {t('grad.thesisAlt')}</p>}
      {d.note && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-900">
          <LocalizedText text={d.note} showBadge={false} />
        </p>
      )}
      <button
        type="button"
        onClick={() => onCalc(d.id)}
        className="mt-auto pt-3 text-left text-sm font-bold text-yu hover:underline"
      >
        {t('grad.calcThis')} →
      </button>
    </article>
  );
}

function Chips({ items, value, onChange, label }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onChange(it.id)}
          aria-pressed={value === it.id}
          className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition ${
            value === it.id ? 'border-yu-dark bg-yu-dark text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-yu-dark'
          }`}
        >
          {it.label}
          {it.count != null && <span className={`ml-1.5 ${value === it.id ? 'text-white/75' : 'text-slate-400'}`}>{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

function Section({ id, title, children, sectionRef }) {
  return (
    <section id={id} ref={sectionRef} className="mt-12 scroll-mt-32">
      <h2 className="text-xl font-extrabold text-yu-dark">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* ---------------- 등록금·장학금 계산 ---------------- */
function Calculator({ deptId, setDeptId }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const [track, setTrack] = useState('new');
  const [degree, setDegree] = useState('M');
  const [level, setLevel] = useState('none');
  const [picked, setPicked] = useState(null);
  const currency = picked ?? defaultCurrency(lang);
  const fx = (n) => convert(n, currency, lang);

  const dept = ALL.find((d) => d.id === deptId) ?? null;
  const trackOk = dept ? (track === 'tr' ? !!dept.tr : true) : true;
  const effTrack = trackOk ? track : 'new';
  const degrees = dept ? degreesOf(dept, effTrack) : ['M', 'D'];
  const effDegree = degrees.includes(degree) ? degree : degrees[0];
  const group = dept ? feeGroupOf(dept) : null;
  const tuition = group ? group[effDegree === 'M' ? 'master' : 'doctor'] : null;
  const lv = GRAD.scholarship.levels.find((l) => l.id === level);
  const rate = lv ? lv[effTrack === 'tr' ? 'rateTransfer' : 'rateNew'] : 0;
  const fee = GRAD.tuition.admissionFee;
  const discount = tuition != null ? Math.round((tuition * rate) / 100) : 0;
  const pay = tuition != null ? fee + tuition - discount : null;

  const Row = ({ label, value, minus, sub }) => (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-slate-700">{label}</p>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
      <div className="shrink-0 text-right tabular-nums">
        <p className={minus ? 'font-bold text-rose-600' : 'text-slate-800'}>{minus && '− '}{won(value, lang)}</p>
        <p className="text-xs text-slate-500">≈ {minus && '− '}{fx(value)}</p>
      </div>
    </div>
  );

  return (
    <div className="rounded-3xl border-2 border-slate-200 bg-white p-4 sm:p-6">
      <label className="block text-sm font-bold text-slate-700" htmlFor="grad-dept">{t('grad.calc.dept')}</label>
      <select
        id="grad-dept"
        value={deptId}
        onChange={(e) => setDeptId(e.target.value)}
        className="mt-1.5 w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 text-[16px] text-slate-900 focus:border-yu-dark focus:outline-none"
      >
        <option value="">{t('grad.calc.choose')}</option>
        {GRAD.fields.map((f) => (
          <optgroup key={f.id} label={tr(f.label, lang)}>
            {f.departments.map((d) => (
              <option key={d.id} value={d.id}>{tr(d.name, lang)}</option>
            ))}
          </optgroup>
        ))}
      </select>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-bold text-slate-700">{t('grad.calc.track')}</p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {['new', 'tr'].map((k) => {
              const disabled = k === 'tr' && dept && !dept.tr;
              return (
                <button
                  key={k}
                  type="button"
                  disabled={disabled}
                  onClick={() => setTrack(k)}
                  aria-pressed={effTrack === k}
                  className={`rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    effTrack === k ? 'border-yu-dark bg-yu-dark text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-yu-dark'
                  }`}
                >
                  {t(`grad.calc.${k}`)}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-700">{t('grad.calc.degree')}</p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {['M', 'D'].map((k) => (
              <button
                key={k}
                type="button"
                disabled={!degrees.includes(k)}
                onClick={() => setDegree(k)}
                aria-pressed={effDegree === k}
                className={`rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  effDegree === k ? 'border-yu-dark bg-yu-dark text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-yu-dark'
                }`}
              >
                {t(`grad.calc.degree${k}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm font-bold text-slate-700">{t('grad.calc.level')}</p>
      <div className="mt-1.5 grid gap-2">
        {GRAD.scholarship.levels.map((l) => {
          const r = l[effTrack === 'tr' ? 'rateTransfer' : 'rateNew'];
          return (
            <label
              key={l.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition ${
                level === l.id ? 'border-yu-dark bg-yu-light' : 'border-slate-200 bg-white hover:border-yu-dark'
              }`}
            >
              <input type="radio" name="grad-level" checked={level === l.id} onChange={() => setLevel(l.id)} className="h-5 w-5 shrink-0 accent-[#003B73]" />
              <LocalizedText text={l.label} showBadge={false} className="min-w-0 flex-1 text-[14px] font-semibold leading-snug text-slate-900" />
              <span className={`shrink-0 text-sm font-bold ${r ? 'text-emerald-700' : 'text-slate-400'}`}>{r}%</span>
            </label>
          );
        })}
      </div>

      <div className="mt-6">
        {!dept ? (
          <p className="rounded-2xl bg-slate-50 p-5 text-center text-[15px] text-slate-600">{t('grad.calc.needDept')}</p>
        ) : tuition == null ? (
          <p className="rounded-2xl bg-amber-50 p-5 text-center text-[15px] text-amber-900">{t('grad.calc.noFee')}</p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">{t('tuition.currency')}</span>
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setPicked(c.code)}
                  aria-pressed={currency === c.code}
                  className={`rounded-full border-2 px-3 py-1 text-sm font-bold transition ${
                    currency === c.code ? 'border-yu-dark bg-yu-dark text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-yu-dark'
                  }`}
                >
                  {c.code}
                </button>
              ))}
            </div>
            <div className="overflow-hidden rounded-2xl border-2 border-yu-dark">
              <div className="bg-yu-dark px-4 py-3 text-white">
                <p className="text-sm text-white/80">
                  <LocalizedText text={group.label} showBadge={false} /> · {t(`grad.calc.degree${effDegree}`)} · {t(`grad.calc.${effTrack}`)}
                </p>
                <p className="text-lg font-extrabold">{tr(dept.name, lang)}</p>
              </div>
              <div className="divide-y divide-slate-100 px-4 py-2 text-[15px]">
                <Row label={t('grad.calc.admissionFee')} value={fee} sub={t('grad.calc.admissionFeeSub')} />
                <Row label={t('grad.calc.tuition')} value={tuition} />
                {rate > 0 && <Row label={t('grad.calc.scholarship', { rate })} value={discount} minus />}
                <div className="flex items-end justify-between gap-3 py-4">
                  <p className="font-extrabold text-slate-900">{t('grad.calc.pay')}</p>
                  <div className="text-right tabular-nums">
                    <p className="text-2xl font-extrabold text-yu-dark">{won(pay, lang)}</p>
                    <p className="mt-0.5 text-[15px] font-bold text-slate-600">≈ {fx(pay)}</p>
                  </div>
                </div>
              </div>
              <p className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">{t('grad.calc.fxNote')}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- 페이지 ---------------- */
export default function Graduate() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const [langFilter, setLangFilter] = useState('all');
  const [degreeFilter, setDegreeFilter] = useState('all');
  const [calcId, setCalcId] = useState('');
  const calcRef = useRef(null);

  const langTest = LANG_FILTERS.find((f) => f.id === langFilter).test;
  const degreeTest = DEGREE_FILTERS.find((f) => f.id === degreeFilter).test;
  const groups = useMemo(
    () =>
      GRAD.fields
        .map((f) => ({ ...f, list: f.departments.map((d) => ({ ...d, field: f.id })).filter((d) => langTest(d) && degreeTest(d)) }))
        .filter((f) => f.list.length),
    [langTest, degreeTest],
  );
  const shown = groups.reduce((n, g) => n + g.list.length, 0);
  const count = (test) => ALL.filter((d) => test(d) && degreeTest(d)).length;

  const openCalc = (id) => {
    setCalcId(id);
    calcRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const summary = [
    { id: 'entrack', icon: '🇬🇧', tone: 'border-indigo-300 bg-indigo-50' },
    { id: 'en', icon: '💬', tone: 'border-sky-200 bg-sky-50' },
    { id: 'ko', icon: '🇰🇷', tone: 'border-slate-200 bg-slate-50' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-8">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{t('grad.title')}</h1>
      <p className="mt-2 text-[15px] text-slate-600">{t('grad.intro')}</p>
      <div className="mt-4">
        <DdayBanner data={GRAD.schedule} />
      </div>

      {/* 수업 언어 요약 */}
      <Section id="grad-lang" title={t('grad.langTitle')}>
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-[15px] leading-relaxed text-slate-700">{t('grad.langIntro')}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {summary.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setLangFilter(s.id)}
              className={`rounded-2xl border-2 p-4 text-left transition hover:shadow-md ${s.tone} ${langFilter === s.id ? 'ring-[3px] ring-yu-dark/40' : ''}`}
            >
              <p className="flex items-center justify-between gap-2">
                <span className="text-[17px] font-extrabold text-slate-900">
                  <span aria-hidden>{s.icon}</span> {t(`grad.summary.${s.id}.title`)}
                </span>
                <span className="text-2xl font-extrabold text-yu-dark">{ALL.filter(LANG_FILTERS.find((f) => f.id === s.id).test).length}</span>
              </p>
              <p className="mt-1 text-sm leading-snug text-slate-600">{t(`grad.summary.${s.id}.text`)}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* 학과 목록 */}
      <Section id="grad-list" title={t('grad.listTitle')}>
        <div className="space-y-3">
          <Chips
            label={t('grad.filterLang')}
            value={langFilter}
            onChange={setLangFilter}
            items={LANG_FILTERS.map((f) => ({ id: f.id, label: t(`grad.filter.${f.id}`), count: count(f.test) }))}
          />
          <Chips
            label={t('grad.filterDegree')}
            value={degreeFilter}
            onChange={setDegreeFilter}
            items={DEGREE_FILTERS.map((f) => ({ id: f.id, label: t(`grad.degreeFilter.${f.id}`) }))}
          />
          <p className="text-sm text-slate-500">{t('grad.shown', { count: shown })}</p>
        </div>
        {groups.map((g) => (
          <div key={g.id} className="mt-8">
            <h3 className="text-lg font-extrabold text-slate-900">
              <LocalizedText text={g.label} showBadge={false} /> <span className="text-sm font-semibold text-slate-400">{g.list.length}</span>
            </h3>
            {g.intro && <LocalizedText as="p" text={g.intro} className="mt-1 text-sm text-slate-500" showBadge={false} />}
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.list.map((d) => (
                <GradCard key={d.id} d={d} onCalc={openCalc} />
              ))}
            </div>
          </div>
        ))}
        {!shown && <p className="mt-6 rounded-2xl bg-slate-50 p-6 text-center text-slate-600">{t('grad.empty')}</p>}
        <p className="mt-6 text-xs leading-relaxed text-slate-500">{t('grad.legend')}</p>
      </Section>

      {/* 지원 자격 */}
      <Section id="grad-eligibility" title={t('grad.eligibilityTitle')}>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-bold text-slate-900">{t('grad.eligibilityCommon')}</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-slate-700">
              {GRAD.eligibility.common.map((x, i) => (
                <li key={i}><LocalizedText text={x} showBadge={false} /></li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
            <p className="font-bold text-slate-900">{t('grad.eligibilityLanguage')}</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-slate-700">
              {GRAD.eligibility.language.map((x, i) => (
                <li key={i}><LocalizedText text={x} showBadge={false} /></li>
              ))}
            </ul>
            <p className="mt-3 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold leading-snug text-white">
              🇬🇧 <LocalizedText text={GRAD.eligibility.englishTrack} showBadge={false} />
            </p>
          </div>
        </div>
      </Section>

      {/* 등록금·장학금 */}
      <Section id="grad-calc" title={t('grad.calcTitle')} sectionRef={calcRef}>
        <p className="mb-3 text-[15px] text-slate-600">{t('grad.calcIntro')}</p>
        <Calculator deptId={calcId} setDeptId={setCalcId} />

        <h3 className="mt-8 text-lg font-bold text-yu-dark">
          {t('grad.feeTable')} <LocalizedText text={GRAD.tuition.basis} className="text-sm font-normal text-slate-500" showBadge={false} />
        </h3>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 sm:text-sm">
            <span>{t('grad.col.group')}</span>
            <span className="text-right">{t('grad.col.master')}</span>
            <span className="text-right">{t('grad.col.doctor')}</span>
          </div>
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2.5 text-[13px] sm:text-[15px]">
            <span>{t('grad.calc.admissionFee')}</span>
            <span className="text-right tabular-nums">{GRAD.tuition.admissionFee.toLocaleString('ko-KR')}</span>
            <span className="text-right tabular-nums">{GRAD.tuition.admissionFee.toLocaleString('ko-KR')}</span>
          </div>
          {GRAD.tuition.groups.map((g) => (
            <div key={g.id} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 border-t border-slate-100 px-3 py-2.5 text-[13px] sm:text-[15px]">
              <LocalizedText text={g.label} showBadge={false} className="min-w-0 leading-snug" />
              <span className="text-right tabular-nums">{g.master.toLocaleString('ko-KR')}</span>
              <span className="text-right tabular-nums">{g.doctor != null ? g.doctor.toLocaleString('ko-KR') : '—'}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">{t('grad.feeTableNote')}</p>

        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
          {GRAD.scholarship.notes.map((x, i) => (
            <li key={i}><LocalizedText text={x} showBadge={false} /></li>
          ))}
        </ul>
      </Section>

      {/* 일정 */}
      <Section id="grad-schedule" title={t('grad.scheduleTitle')}>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 sm:text-sm">
            <span>{t('grad.col.step')}</span>
            <span>{t('grad.col.first')}</span>
            <span>{t('grad.col.second')}</span>
          </div>
          {GRAD.schedule.rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 border-t border-slate-100 px-3 py-2.5 text-[13px] leading-snug sm:text-[15px]">
              <LocalizedText text={r.label} showBadge={false} className="font-semibold text-slate-800" />
              <LocalizedText text={r.first} showBadge={false} className="text-slate-500" />
              <LocalizedText text={r.second} showBadge={false} className="font-semibold text-slate-900" />
            </div>
          ))}
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
          {GRAD.schedule.notes.map((x, i) => (
            <li key={i}><LocalizedText text={x} showBadge={false} /></li>
          ))}
        </ul>
      </Section>

      {/* 문의 · 안내 */}
      <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-5 text-[15px] leading-relaxed text-slate-700">
        <p className="font-bold text-slate-900">
          {t('grad.contactTitle')} · <LocalizedText text={GRAD.contact.team} showBadge={false} />
        </p>
        <p className="mt-1">☎ {GRAD.contact.tel}</p>
        <p>
          ✉ <a href={`mailto:${GRAD.contact.email}`} className="font-semibold text-yu underline">{GRAD.contact.email}</a>
        </p>
        <p>📍 <LocalizedText text={GRAD.contact.visit} showBadge={false} /></p>
        <a href={GRAD.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-yu underline">
          engraduate.yu.ac.kr ↗
        </a>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-[15px] leading-relaxed text-amber-950">
        <p className="font-bold">⚠ {t('grad.disclaimerTitle')}</p>
        <p className="mt-1">
          {t('grad.disclaimer', { source: tr(GRAD.source, lang) })}
        </p>
      </div>
    </div>
  );
}
