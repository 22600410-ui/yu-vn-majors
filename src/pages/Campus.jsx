import { useTranslation } from 'react-i18next';
import LocalizedText from '../components/LocalizedText';
import campus from '../data/campus.json';

/** 이동 경로: 단계들을 화살표로 이어서 (휴대폰에서는 위아래로) */
function Route({ route }) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <p className="flex items-center gap-2 text-[16px] font-extrabold text-slate-900">
        <span aria-hidden className="text-2xl">{route.icon}</span>
        <LocalizedText text={route.title} showBadge={false} />
      </p>
      {route.time && <LocalizedText as="p" text={route.time} className="mt-1 text-sm font-semibold text-emerald-700" showBadge={false} />}
      <ol className="mt-3 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        {route.steps.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden className="text-slate-400">
                <span className="sm:hidden">↓</span>
                <span className="hidden sm:inline">→</span>
              </span>
            )}
            <LocalizedText text={s} className="rounded-lg bg-slate-100 px-3 py-1.5 text-[15px] leading-snug text-slate-800" showBadge={false} />
          </li>
        ))}
      </ol>
      {route.note && <LocalizedText as="p" text={route.note} className="mt-3 text-sm text-slate-600" />}
    </li>
  );
}

export default function Campus() {
  const { t } = useTranslation();
  const embed = `https://www.google.com/maps?q=${encodeURIComponent(campus.mapQuery)}&output=embed`;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-8">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{t('campus.title')}</h1>
      <p className="mt-2 text-[15px] text-slate-600">{t('campus.intro')}</p>

      {/* 한눈에 */}
      <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {campus.facts.map((f, i) => (
          <li key={i} className="flex gap-3 rounded-2xl bg-yu-light p-4">
            <span aria-hidden className="text-2xl">{f.icon}</span>
            <LocalizedText text={f.text} className="min-w-0 text-[15px] font-semibold leading-snug text-slate-900" showBadge={false} />
          </li>
        ))}
      </ul>

      {/* 위치 */}
      <section className="mt-10">
        <h2 className="text-xl font-extrabold text-yu-dark">📍 {t('campus.location')}</h2>
        <LocalizedText as="p" text={campus.address} className="mt-2 text-[16px] font-semibold text-slate-900" showBadge={false} />
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
          <iframe
            title={t('campus.mapTitle')}
            src={embed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-64 w-full sm:h-80"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={campus.googleMap} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-yu-dark px-4 py-2.5 text-sm font-bold text-white hover:bg-yu">
            Google Maps ↗
          </a>
          <a href={campus.kakaoMap} target="_blank" rel="noopener noreferrer" className="rounded-xl border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-yu-dark">
            {t('campus.kakaoMap')} ↗
          </a>
        </div>
      </section>

      {/* 오는 방법 */}
      <section className="mt-10">
        <h2 className="text-xl font-extrabold text-yu-dark">🧭 {t('campus.transport')}</h2>
        <ul className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {campus.routes.map((r) => (
            <Route key={r.id} route={r} />
          ))}
        </ul>
      </section>

      {/* 기숙사 */}
      <section className="mt-10">
        <h2 className="text-xl font-extrabold text-yu-dark">🏠 {t('campus.dorm')}</h2>
        <LocalizedText as="p" text={campus.dorm.text} className="mt-3 rounded-2xl bg-slate-50 p-4 text-[15px] leading-relaxed text-slate-800" />
      </section>

      {/* 도착 후 할 일 */}
      <section className="mt-10">
        <h2 className="text-xl font-extrabold text-yu-dark">✅ {t('campus.settle')}</h2>
        <p className="mt-1 text-sm text-slate-600">{t('campus.settleIntro')}</p>
        <ol className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {campus.settle.map((s, i) => (
            <li key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="flex items-center gap-2 font-extrabold text-slate-900">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yu-dark text-xs text-white">{i + 1}</span>
                <span aria-hidden>{s.icon}</span>
                <LocalizedText text={s.title} showBadge={false} />
              </p>
              <LocalizedText as="p" text={s.text} className="mt-2 text-[15px] leading-relaxed text-slate-700" />
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-[15px] leading-relaxed text-amber-950">
        <p>{t('campus.disclaimer')}</p>
        <a href={campus.admissionLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-amber-900 underline">
          {t('campus.admissionLink')} ↗
        </a>
      </div>
    </div>
  );
}
