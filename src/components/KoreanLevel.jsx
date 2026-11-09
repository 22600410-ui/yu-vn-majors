import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LocalizedText from './LocalizedText';
import req from '../data/language-requirements.json';

const TRACKS = ['freshman', 'transfer'];

/** 학과·입학 유형별 한국어 기준 (공식 기준이 확인되지 않았으면 null) */
export function koreanLevelOf(department, track) {
  if (!req.confirmed) return null;
  const own = req.departments?.[department.name.ko];
  return own?.[track] ?? req.default?.[track] ?? null;
}

/** 이 학과가 모집하는 입학 유형 중 기준이 하나라도 있는지 */
export const hasKoreanLevel = (department) =>
  TRACKS.some((tr) => department.admission?.[tr] && koreanLevelOf(department, tr));

/**
 * 필요한 한국어 수준 표시
 * - variant="detail": 상세 페이지 상자 (기준이 없으면 '모집요강 확인' 안내 + FAQ 링크)
 * - variant="compact": 비교표·추천 카드용 짧은 표시
 */
export default function KoreanLevel({ department, variant = 'detail', className = '' }) {
  const { t } = useTranslation();
  const tracks = TRACKS.filter((tr) => department.admission?.[tr]);
  const rows = tracks.map((tr) => ({ track: tr, level: koreanLevelOf(department, tr) }));
  const known = rows.some((r) => r.level);

  if (variant === 'compact') {
    if (!known) return <p className={`text-sm text-slate-500 ${className}`}>{t('korean.checkGuide')}</p>;
    return (
      <ul className={`space-y-1 text-sm ${className}`}>
        {rows.map((r) => (
          <li key={r.track}>
            <span className="font-semibold text-slate-600">{t(`admission.${r.track}`)}</span>{' '}
            {r.level ? <LocalizedText text={r.level.level} className="font-bold text-slate-900" /> : <span className="text-slate-500">{t('korean.checkGuide')}</span>}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={`rounded-xl border border-violet-200 bg-violet-50 p-4 ${className}`}>
      {known ? (
        <>
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.track} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <span className="shrink-0 font-semibold text-violet-900 sm:w-24">{t(`admission.${r.track}`)}</span>
                <span className="min-w-0">
                  {r.level ? (
                    <>
                      <LocalizedText text={r.level.level} className="text-[17px] font-extrabold text-slate-900" />
                      <LocalizedText as="p" text={r.level.note} className="mt-0.5 text-sm text-slate-700" />
                    </>
                  ) : (
                    <span className="text-slate-600">{t('korean.checkGuide')}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-600">
            {t('korean.sourceNote', { year: req.year ?? '', source: req.source ?? '' })}
          </p>
        </>
      ) : (
        <>
          <p className="text-[15px] font-semibold text-violet-950">{t('korean.pendingTitle')}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{t('korean.pendingText')}</p>
          <Link to="/faq" className="mt-2 inline-block text-sm font-semibold text-violet-800 underline">
            {t('korean.faqLink')} →
          </Link>
        </>
      )}
    </div>
  );
}
