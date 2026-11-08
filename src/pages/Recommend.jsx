import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDepartments } from '../hooks/useDepartments';
import { recommend, rules } from '../utils/recommend';
import DepartmentCard from '../components/DepartmentCard';
import LocalizedText from '../components/LocalizedText';

const TRACK_OPTIONS = ['freshman', 'transfer', 'unsure'];

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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-yu-dark">{t('recommend.title')}</h1>
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
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
