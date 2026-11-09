import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDepartments } from '../hooks/useDepartments';
import { recommend, rules } from '../utils/recommend';
import DepartmentCard from '../components/DepartmentCard';
import LocalizedText from '../components/LocalizedText';
import MajorCard from '../components/MajorCard';
import { loadLastResult, parseCode, recommendByTypes } from '../utils/majorTest';
import { tr } from '../utils/localize';

const TRACK_OPTIONS = ['freshman', 'transfer', 'unsure'];
const TRACK_FILTERS = ['all', 'freshman', 'transfer'];

/** 전공 유형 테스트 결과로 추천: 테스트를 했으면 유형 + 추천 학과, 안 했으면 테스트 안내 */
function TestResultSection({ data }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const [track, setTrack] = useState('all');
  const last = useMemo(() => loadLastResult(), []);
  const types = last ? parseCode(last.code) : null;
  const recs = useMemo(() => (types ? recommendByTypes(data, types, { track, limit: 8 }) : []), [data, last?.code, track]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!types) {
    return (
      <section className="mt-6 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-100 p-6 text-center sm:p-10">
        <p className="text-5xl" aria-hidden>🧩</p>
        <h2 className="mt-3 text-xl font-extrabold text-slate-900 sm:text-2xl">{t('recommend.noTestTitle')}</h2>
        <p className="mt-2 text-[15px] text-slate-700">{t('recommend.noTestText')}</p>
        <Link to="/test" className="mt-5 inline-block rounded-2xl bg-yu-dark px-6 py-3 font-bold text-white hover:bg-yu">
          {t('test.start')} →
        </Link>
      </section>
    );
  }

  const [first, second] = types;
  return (
    <section className="mt-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-yu-dark via-[#0a3a6e] to-[#06213f] p-6 text-white sm:flex-row sm:items-center sm:p-8">
        <p className="text-6xl" aria-hidden>{first.emoji}</p>
        <div className="flex-1">
          <p className="text-sm text-white/80">{t('recommend.fromTest')}</p>
          <p className="mt-1 text-2xl font-extrabold">{tr(first.name, lang)}</p>
          <p className="mt-1 text-[15px] text-white/90">
            {tr(first.holland, lang)}
            {second && ` + ${tr(second.holland, lang)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/test/result/${last.code}`} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-yu-dark hover:bg-yu-light">
            {t('recommend.viewResult')}
          </Link>
          <Link to="/test" className="rounded-xl border-2 border-white/70 px-4 py-2 text-sm font-bold text-white hover:bg-white/10">
            ↺ {t('test.retry')}
          </Link>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {TRACK_FILTERS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTrack(k)}
            aria-pressed={track === k}
            className={`rounded-full border-2 px-3.5 py-1.5 text-sm transition ${
              track === k ? 'border-yu-dark bg-yu-dark font-bold text-white ring-2 ring-yu-dark/25' : 'border-slate-200 bg-white text-slate-700 hover:border-yu-dark'
            }`}
          >
            {t(`admission.${k}`)}
          </button>
        ))}
      </div>
      {recs.length === 0 && <p className="mt-6 text-slate-600">{t('search.noResult')}</p>}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {recs.map((r, i) => (
          <MajorCard key={r.department.id} department={r.department} college={r.college} index={i} />
        ))}
      </div>
    </section>
  );
}

function Option({ selected, onClick, children, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`rounded-xl border-2 px-4 py-2.5 text-left text-[15px] transition disabled:cursor-not-allowed disabled:opacity-40 ${
        selected
          ? 'border-yu-dark bg-yu-dark font-semibold text-white shadow ring-[3px] ring-yu-dark/25'
          : 'border-slate-200 bg-white hover:border-yu-dark'
      }`}
    >
      {children}
    </button>
  );
}

export default function Recommend() {
  const { t } = useTranslation();
  const { data, loading } = useDepartments();
  const [track, setTrack] = useState('unsure');
  const [interests, setInterests] = useState([]);
  const [career, setCareer] = useState(null);
  const [submitted, setSubmitted] = useState(null); // 마지막으로 '추천 보기'를 누른 답변
  const resultRef = useRef(null);

  const toggleInterest = (id) =>
    setInterests((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const results = useMemo(() => (submitted ? recommend(data, submitted) : []), [data, submitted]);

  const submit = () => {
    setSubmitted({ track, interests, career });
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };
  const reset = () => {
    setTrack('unsure');
    setInterests([]);
    setCareer(null);
    setSubmitted(null);
  };

  if (loading) return <p className="p-8 text-center">{t('common.loading')}</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{t('recommend.title')}</h1>

      {/* ① 전공 유형 테스트 결과로 추천 (이 브라우저에서 마지막으로 한 테스트) */}
      <TestResultSection data={data} />

      {/* ② 관심 분야·희망 진로를 직접 골라 추천 */}
      <h2 className="mt-14 border-t pt-10 text-xl font-extrabold text-slate-900 sm:text-2xl">{t('recommend.manualTitle')}</h2>
      <p className="mt-1 text-slate-600">{t('recommend.intro')}</p>

      <section className="mt-8">
        <h2 className="font-semibold">{t('recommend.q1')}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {TRACK_OPTIONS.map((k) => (
            <Option key={k} selected={track === k} onClick={() => setTrack(k)}>
              {k === 'unsure' ? t('recommend.unsure') : t(`admission.${k}`)}
            </Option>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold">{t('recommend.q2', { max: rules.maxInterests })}</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rules.interests.map((i) => {
            const selected = interests.includes(i.id);
            return (
              <Option
                key={i.id}
                selected={selected}
                disabled={!selected && interests.length >= rules.maxInterests}
                onClick={() => toggleInterest(i.id)}
              >
                <span className="mr-2" aria-hidden>{i.icon}</span>
                <LocalizedText text={i.label} showBadge={false} />
              </Option>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold">{t('recommend.q3')}</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rules.careers.map((c) => (
            <Option key={c.id} selected={career === c.id} onClick={() => setCareer(career === c.id ? null : c.id)}>
              <span className="mr-2" aria-hidden>{c.icon}</span>
              <LocalizedText text={c.label} showBadge={false} />
            </Option>
          ))}
          <Option selected={career === null} onClick={() => setCareer(null)}>{t('recommend.careerNone')}</Option>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={interests.length === 0}
          className="rounded-xl bg-yu px-6 py-3 font-semibold text-white shadow hover:bg-yu-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('recommend.submit')}
        </button>
        <button type="button" onClick={reset} className="rounded-xl border px-6 py-3 text-slate-700 hover:border-yu">
          {t('recommend.reset')}
        </button>
        {interests.length === 0 && <span className="text-sm text-slate-500">{t('recommend.needInterest')}</span>}
      </div>

      {submitted && (
        <section ref={resultRef} className="mt-12 scroll-mt-4">
          <h2 className="text-xl font-bold text-yu-dark">{t('recommend.resultsTitle')}</h2>
          {results.length === 0 ? (
            <p className="mt-4 text-slate-600">{t('recommend.resultsEmpty')}</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r) => (
                <DepartmentCard key={r.department.id} department={r.department}>
                  <div className="mt-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                    <span className="font-medium">{t('recommend.reasons')}: </span>
                    {r.reasons.map((x, i) => (
                      <span key={x.item.id}>
                        {i > 0 && ', '}
                        <LocalizedText text={x.item.label} showBadge={false} />
                      </span>
                    ))}
                  </div>
                </DepartmentCard>
              ))}
            </div>
          )}
          <p className="mt-6 text-xs text-slate-500">{t('recommend.disclaimer')}</p>
          <Link to="/departments" className="mt-2 inline-block text-sm text-yu underline">{t('recommend.seeAll')}</Link>
        </section>
      )}
    </div>
  );
}
