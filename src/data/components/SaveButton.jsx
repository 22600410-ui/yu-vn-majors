import { useTranslation } from 'react-i18next';
import { useSaved } from '../utils/saved';
import { useNotice } from './Notice';

/**
 * 관심 학과 ♡ 버튼
 * variant="overlay": 카드 사진 위 동그란 버튼 / variant="pill": 상세 페이지의 글자 버튼
 */
export default function SaveButton({ department, variant = 'overlay', className = '' }) {
  const { t } = useTranslation();
  const { isSaved, toggle } = useSaved();
  const { notify } = useNotice();
  const saved = isSaved(department.id);

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(department.id);
    notify(saved ? t('saved.removed') : t('saved.added'));
  };

  const label = saved ? t('saved.remove') : t('saved.add');
  const heart = (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2">
      <path strokeLinejoin="round" d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3Z" />
    </svg>
  );

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-sm font-bold transition ${
          saved ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-700 hover:border-rose-400 hover:text-rose-600'
        } ${className}`}
      >
        {heart}
        {saved ? t('saved.savedLabel') : t('saved.add')}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      data-save
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-110 ${
        saved ? 'text-rose-500' : 'text-slate-600 hover:text-rose-500'
      } ${className}`}
    >
      {heart}
    </button>
  );
}
