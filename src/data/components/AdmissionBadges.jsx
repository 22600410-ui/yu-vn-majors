import { useTranslation } from 'react-i18next';

const STYLE = {
  freshman: 'bg-emerald-100 text-emerald-800',
  transfer: 'bg-sky-100 text-sky-800',
};

/** 신입학 / 편입학 지원 가능 배지 */
export default function AdmissionBadges({ admission, className = '' }) {
  const { t } = useTranslation();
  if (!admission) return null;
  return (
    <span className={`inline-flex flex-wrap gap-1 ${className}`}>
      {['freshman', 'transfer'].map(
        (track) =>
          admission[track] && (
            <span key={track} className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${STYLE[track]}`}>
              {t(`admission.${track}`)}
            </span>
          ),
      )}
    </span>
  );
}
