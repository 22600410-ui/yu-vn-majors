import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDepartments } from '../hooks/useDepartments';
import { FIELDS, fieldOf } from '../utils/fields';
import { tr } from '../utils/localize';
import MajorCard from '../components/MajorCard';
import LocalizedText from '../components/LocalizedText';
import UnderlineTabs from '../components/UnderlineTabs';
import FaqSection from '../components/FaqSection';
import DdayBanner from '../components/DdayBanner';
import { useChat } from '../components/RecommenderChat';
import { isComingSoon } from '../components/Notice';

// 상단 기능 카드: 큰 글씨 헤드라인 + 아래 제목/설명 (챗봇 카드는 보류 중이라 뺌)
const FEATURES = [
  { key: 'test', to: '/test', emoji: '🧩', bg: 'from-amber-100 to-orange-200', dark: false },
  { key: 'transfer', to: '/departments?track=transfer', emoji: '🎓', bg: 'from-emerald-100 to-teal-200', dark: false },
  { key: 'faq', to: '/faq', emoji: '💬', bg: 'from-indigo-700 to-violet-800', dark: true },
];

function FeatureCard({ f, onChat }) {
  const { t } = useTranslation();
  const body = (
    <>
      <div className={`relative aspect-[16/7] overflow-hidden rounded-2xl bg-gradient-to-br p-4 sm:aspect-[16/11] sm:p-5 ${f.bg}`}>
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
            f.dark ? 'bg-white/20 text-white' : 'bg-white/70 text-slate-800'
          }`}
        >
          {t(`features.${f.key}.badge`)}
        </span>
        <p
          className={`mt-2 whitespace-pre-line text-lg font-extrabold leading-snug sm:text-2xl ${
            f.dark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {t(`features.${f.key}.headline`)}
        </p>
        <span aria-hidden className="absolute -bottom-2 right-2 text-6xl transition group-hover:scale-110 sm:text-7xl">
          {f.emoji}
        </span>
      </div>
      <p className="mt-3 text-base font-bold text-slate-900 group-hover:text-yu sm:text-[17px]">{t(`features.${f.key}.title`)}</p>
      <p className="mt-0.5 text-sm text-slate-600">{t(`features.${f.key}.sub`)}</p>
    </>
  );
  return f.action === 'chat' ? (
    <button type="button" onClick={onChat} className="group text-left">{body}</button>
  ) : (
    <Link to={f.to} className="group block">{body}</Link>
  );
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const { data, loading, error } = useDepartments();
  const { open: openChat } = useChat();
  const [field, setField] = useState('all');
  const meta = data?.meta;
  const lang = i18n.resolvedLanguage;

  // 단과대학 순서를 유지한 채 학과를 한 줄로 펼침
  const all = useMemo(
    () => (data?.colleges ?? []).flatMap((college) => college.departments.map((department) => ({ department, college }))),
    [data],
  );
  const counts = useMemo(() => {
    const c = {};
    for (const x of all) {
      const id = fieldOf(x.department, x.college)?.id;
      c[id] = (c[id] ?? 0) + 1;
    }
    return c;
  }, [all]);
  const shown = field === 'all' ? all : all.filter((x) => fieldOf(x.department, x.college)?.id === field);
  const tabs = [
    { id: 'all', label: t('home.fieldAll'), count: all.length },
    ...FIELDS.map((f) => ({ id: f.id, label: tr(f.label, lang), count: counts[f.id] ?? 0 })),
  ];

  return (
    <div className="pb-24">
      {/* 입학 일정 D-day (src/data/schedule.json, 남은 일정이 없으면 숨김) */}
      <section className="mx-auto max-w-6xl px-4 pt-5">
        <DdayBanner />
      </section>

      {/* 상단 기능 카드 */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.key} f={f} onChat={openChat} />
          ))}
        </div>
      </section>

      {/* 학과 카드 섹션 */}
      <section className="mx-auto mt-14 max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{t('home.sectionTitle')}</h2>
          <Link to="/departments" className="text-sm font-semibold text-yu hover:underline">{t('home.ctaBrowse')} →</Link>
        </div>
        <p className="mt-1 text-[15px] text-slate-600">{t('home.heroText', { count: all.length || '—' })}</p>

        <div className="mt-5">
          <UnderlineTabs items={tabs} value={field} onChange={setField} label={t('home.fieldFilter')} />
        </div>

        {loading && <p className="py-12 text-center text-slate-500">{t('common.loading')}</p>}
        {error && <p className="py-12 text-center text-red-600">{t('common.error')}</p>}

        {/* 모바일 2열 / 데스크톱 4열 */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {shown.map(({ department, college }, i) => (
            <MajorCard key={department.id} department={department} college={college} index={i} />
          ))}
        </div>
      </section>

      {/* 자주 묻는 질문 (site.json comingSoon 에 'faq' 가 있으면 숨김) */}
      {!isComingSoon('faq') && (
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <FaqSection limit={6} />
        </section>
      )}

      {/* 지원 전 확인 사항 */}
      <section className="mx-auto mt-14 max-w-6xl px-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-amber-900">{t('home.noticeTitle')}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-amber-950">
            {meta?.admission?.year && (
              <li>
                <LocalizedText text={meta.admission.year} showBadge={false} /> {t('admission.basis')}
              </li>
            )}
            {meta?.admission?.notes?.map((n) => (
              <li key={n.ko}><LocalizedText text={n} /></li>
            ))}
            <li>{t('home.noticeCheckGuide')}</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
