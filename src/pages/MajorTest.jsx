import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDepartments } from '../hooks/useDepartments';
import { QUESTIONS, TYPES, codeFromScores, parseCode, recommendByTypes, saveLastResult, scoreAnswers } from '../utils/majorTest';
import { tr } from '../utils/localize';
import MajorCard from '../components/MajorCard';

const TRACKS = ['all', 'freshman', 'transfer'];

function BetaBadge() {
  const { t } = useTranslation();
  return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">{t('test.beta')}</span>;
}

/* ---------- 시작 화면 ---------- */
function Intro({ onStart }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center sm:py-16">
      <BetaBadge />
      <p className="mt-6 text-6xl" aria-hidden>🧩</p>
      <h1 className="mt-4 text-3xl font-extrabold leading-snug text-slate-900 sm:text-4xl">{t('test.title')}</h1>
      <p className="mt-3 text-lg text-slate-700">{t('test.subtitle')}</p>
      <ul className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-3 text-center">
        {['meta1', 'meta2', 'meta3'].map((k) => (
          <li key={k} className="rounded-2xl bg-slate-50 px-2 py-4">
            <p className="text-lg font-extrabold text-yu-dark">{t(`test.${k}Value`)}</p>
            <p className="mt-0.5 text-sm text-slate-600">{t(`test.${k}Label`)}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-[15px] text-slate-600">{t('test.notice')}</p>
      <button
        type="button"
        onClick={onStart}
        className="mt-8 w-full rounded-2xl bg-yu-dark py-4 text-lg font-bold text-white shadow-lg transition hover:bg-yu sm:w-72"
      >
        {t('test.start')}
      </button>
    </div>
  );
}

/* ---------- 질문 화면 ---------- */
function Question({ index, onAnswer, onBack }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const q = QUESTIONS[index];
  const progress = ((index + 1) / QUESTIONS.length) * 100;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
      {/* 진행 막대 */}
      <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
        <button type="button" onClick={onBack} className="rounded-lg px-2 py-1 hover:bg-slate-100">
          ← {t('test.back')}
        </button>
        <span>
          <b className="text-yu-dark">{index + 1}</b> / {QUESTIONS.length}
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS.length} aria-valuenow={index + 1}>
        <div className="h-full rounded-full bg-yu-dark transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* 질문 + 큰 버튼 2개 */}
      <p className="mt-10 text-center text-sm font-bold text-yu">Q{index + 1}</p>
      <h2 key={index} className="mt-2 text-center text-2xl font-extrabold leading-snug text-slate-900 sm:text-[28px]">
        {tr(q.q, lang)}
      </h2>
      <div className="mt-10 space-y-4">
        {q.options.map((opt, i) => (
          <button
            key={`${index}-${i}`}
            type="button"
            onClick={() => onAnswer(opt.type)}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white px-5 py-5 text-left text-[17px] font-semibold leading-snug text-slate-800 transition hover:border-yu-dark hover:bg-yu-light/40 active:scale-[0.99] active:border-yu-dark active:ring-[3px] active:ring-yu-dark/25"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yu-light text-sm font-extrabold text-yu-dark">
              {i === 0 ? 'A' : 'B'}
            </span>
            {tr(opt.text, lang)}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- 결과 화면 ---------- */
function Result({ code }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const { state } = useLocation(); // 방금 테스트를 마쳤다면 유형별 점수가 들어 있음 (공유 링크로 들어오면 없음)
  const { data, loading } = useDepartments();
  const [track, setTrack] = useState('all');
  const [copied, setCopied] = useState(false);
  const types = parseCode(code);

  const recs = useMemo(() => (types ? recommendByTypes(data, types, { track }) : []), [data, types?.map((x) => x.id).join(''), track]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!types) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-slate-700">{t('test.invalid')}</p>
        <Link to="/test" className="mt-4 inline-block font-bold text-yu-dark underline">{t('test.retry')}</Link>
      </div>
    );
  }
  const [first, second] = types;
  const scores = state?.scores;
  const max = scores ? Math.max(...Object.values(scores), 1) : 1;

  const copyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt(t('test.copyLink'), url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8">
      {/* 유형 카드 */}
      <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-gradient-to-br from-yu-dark via-[#0a3a6e] to-[#06213f] px-6 py-10 text-center text-white shadow-xl sm:px-10">
        <BetaBadge />
        <p className="mt-5 text-[15px] text-white/80">{t('test.resultIntro')}</p>
        <p className="mt-3 text-7xl" aria-hidden>{first.emoji}</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-snug sm:text-4xl">{tr(first.name, lang)}</h1>
        <p className="mt-2 text-lg font-semibold text-white/90">
          {tr(first.holland, lang)}
          {second && (
            <>
              {' '}+ {tr(second.holland, lang)} <span aria-hidden>{second.emoji}</span>
            </>
          )}
        </p>
      </section>

      <div className="mx-auto mt-8 grid max-w-4xl gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-extrabold text-slate-900">{t('test.traitsTitle')}</h2>
          <ul className="mt-3 space-y-2 text-[16px] leading-relaxed text-slate-800">
            {first.traits.map((x, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-yu-dark">✓</span>
                {tr(x, lang)}
              </li>
            ))}
          </ul>
          <h2 className="mt-6 text-lg font-extrabold text-slate-900">{t('test.studyTitle')}</h2>
          <p className="mt-2 text-[16px] leading-relaxed text-slate-800">{tr(first.study, lang)}</p>
        </section>

        <section className="rounded-2xl border border-slate-200 p-6">
          {scores ? (
            <>
              <h2 className="text-lg font-extrabold text-slate-900">{t('test.scoreTitle')}</h2>
              <ul className="mt-4 space-y-3">
                {TYPES.map((x) => (
                  <li key={x.id} className="flex items-center gap-3 text-[15px]">
                    <span className="w-24 shrink-0 font-semibold text-slate-800">
                      {x.emoji} {tr(x.holland, lang)}
                    </span>
                    <span className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className={`block h-full rounded-full ${x.id === first.id || x.id === second?.id ? 'bg-yu-dark' : 'bg-slate-300'}`}
                        style={{ width: `${(scores[x.id] / max) * 100}%` }}
                      />
                    </span>
                    <span className="w-6 text-right font-bold text-slate-700">{scores[x.id]}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            second && (
              <>
                <h2 className="text-lg font-extrabold text-slate-900">{t('test.secondType')}</h2>
                <p className="mt-3 text-4xl" aria-hidden>{second.emoji}</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{tr(second.name, lang)}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-700">{tr(second.traits[0], lang)}</p>
              </>
            )
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" onClick={copyLink} className="rounded-xl bg-yu-dark px-4 py-2.5 text-sm font-bold text-white hover:bg-yu">
              🔗 {copied ? t('test.copied') : t('test.copyLink')}
            </button>
            <Link to="/test" className="rounded-xl border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-yu-dark">
              ↺ {t('test.retry')}
            </Link>
          </div>
        </section>
      </div>

      {/* 어울리는 학과 */}
      <section className="mt-14">
        <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{t('test.recommendTitle')}</h2>
        {second && (
          <p className="mt-1 text-[15px] text-slate-600">
            {t('test.comboLabel', { a: tr(first.holland, lang), b: tr(second.holland, lang) })}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {TRACKS.map((k) => (
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
        {loading && <p className="py-10 text-center text-slate-500">{t('common.loading')}</p>}
        {!loading && recs.length === 0 && <p className="py-10 text-center text-slate-600">{t('search.noResult')}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {recs.map((r, i) => (
            <div key={r.department.id} className="flex flex-col">
              <p className="mb-1.5 truncate text-[13px] font-semibold text-yu-dark">
                {r.types.length > 1 ? `★ ${t('test.bothTypes')}` : `${typeLabel(r.types[0], lang)}`}
              </p>
              <div className="flex-1">
                <MajorCard department={r.department} college={r.college} index={i} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-yu-light p-6 text-center">
          <p className="text-lg font-bold text-slate-900">{t('test.moreTitle')}</p>
          <Link to="/recommend" className="mt-4 inline-block rounded-xl bg-yu-dark px-6 py-3 font-bold text-white hover:bg-yu">
            {t('test.more')} →
          </Link>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">{t('test.disclaimer')}</p>
      </section>
    </div>
  );
}

function typeLabel(id, lang) {
  const x = TYPES.find((tp) => tp.id === id);
  return x ? `${x.emoji} ${tr(x.holland, lang)}` : '';
}

/* ---------- 라우트: /test (시작·질문) · /test/result/:code (결과) ---------- */
export default function MajorTest() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(-1); // -1 = 시작 화면, 0~11 = 질문
  const [answers, setAnswers] = useState([]);

  if (code) return <Result code={code} />;

  if (step < 0) {
    return (
      <Intro
        onStart={() => {
          setAnswers([]);
          setStep(0);
        }}
      />
    );
  }

  const answer = (type) => {
    const next = [...answers.slice(0, step), type];
    window.scrollTo(0, 0);
    if (step + 1 >= QUESTIONS.length) {
      const scores = scoreAnswers(next);
      const code = codeFromScores(scores);
      saveLastResult(code, scores); // '학과 추천' 메뉴에서 다시 보여 주기 위해 기억
      // 결과 화면에서 '다시 하기'로 돌아오면 시작 화면부터 보이도록 초기화
      setStep(-1);
      setAnswers([]);
      navigate(`/test/result/${code}`, { state: { scores } });
      return;
    }
    setAnswers(next);
    setStep(step + 1);
  };

  return <Question index={step} onAnswer={answer} onBack={() => setStep(step - 1)} />;
}
