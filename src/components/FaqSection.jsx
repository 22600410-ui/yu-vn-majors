import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDepartments } from '../hooks/useDepartments';
import { buildFaqs, faqText, FAQ_CATEGORIES } from '../utils/faq';
import { tr } from '../utils/localize';
import UnderlineTabs from './UnderlineTabs';
import LocalizedText from './LocalizedText';
import { useChat } from './RecommenderChat';

/** 카드 아래 출처 줄: 관련 학과가 있으면 [단과대학] 학과명, 없으면 [영남대학교] 분류 */
function CardFooter({ item }) {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const first = item.related?.[0];
  const cat = FAQ_CATEGORIES.find((c) => c.id === item.category);
  return (
    <div className="flex min-w-0 items-center gap-2 text-[15px]">
      <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yu-light text-[11px] font-extrabold text-yu">YU</span>
      {first ? (
        <span className="min-w-0 truncate">
          <b className="font-bold text-slate-900">{tr(first.college.name, lang)}</b>{' '}
          <span className="text-slate-700">{tr(first.department.name, lang)}</span>
        </span>
      ) : (
        <span className="min-w-0 truncate">
          <b className="font-bold text-slate-900">Yeungnam University</b>{' '}
          <span className="text-slate-700">{tr(cat?.label, lang)}</span>
        </span>
      )}
    </div>
  );
}

function FaqModal({ item, onClose }) {
  const { t, i18n } = useTranslation();
  const { ask } = useChat();
  const { q, a } = faqText(item, t, i18n.resolvedLanguage);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const actionLink = { recommend: '/recommend', departments: '/departments' }[item.action];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={q}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8"
      >
        <p className="text-sm font-bold text-yu">Q.</p>
        <h3 className="mt-1 text-xl font-extrabold leading-snug text-slate-900">{q}</h3>
        <div className="mt-5 rounded-2xl bg-slate-50 p-5">
          <p className="text-sm font-bold text-slate-500">A.</p>
          <p className="mt-1 whitespace-pre-line text-base leading-relaxed text-slate-800">{a}</p>
        </div>

        {item.related?.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-600">{t('faq.relatedDepartments')}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {item.related.map(({ department }) => (
                <li key={department.id}>
                  <Link
                    to={`/department/${department.id}`}
                    onClick={onClose}
                    className="inline-block rounded-full border border-slate-300 px-3.5 py-1.5 text-[15px] font-medium text-slate-800 hover:border-yu hover:text-yu"
                  >
                    <LocalizedText text={department.name} showBadge={false} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {actionLink && (
            <Link to={actionLink} onClick={onClose} className="rounded-xl border border-yu px-4 py-3 text-center font-bold text-yu hover:bg-yu-light">
              {t(`faq.action.${item.action}`)}
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              onClose();
              ask(t('faq.followUp', { q }));
            }}
            className="rounded-xl bg-yu px-4 py-3 font-bold text-white hover:bg-yu-dark sm:ml-auto"
          >
            ✦ {t('faq.askAi')}
          </button>
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-3 font-semibold text-slate-600 hover:bg-slate-100">
            {t('chat.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 자주 묻는 질문: 밑줄 탭 + Q/A 카드 (limit 을 주면 그 개수만 보여 주고 '더 보기' 링크) */
export default function FaqSection({ limit, title = true }) {
  const { t, i18n } = useTranslation();
  const { data } = useDepartments();
  const [category, setCategory] = useState('all');
  const [open, setOpen] = useState(null);
  const lang = i18n.resolvedLanguage;

  const items = useMemo(() => buildFaqs(data), [data]);
  const filtered = category === 'all' ? items : items.filter((x) => x.category === category);
  const shown = limit ? filtered.slice(0, limit) : filtered;
  const tabs = [
    { id: 'all', label: t('home.fieldAll') },
    ...FAQ_CATEGORIES.map((c) => ({ id: c.id, label: tr(c.label, lang) })),
  ];

  return (
    <div>
      {title && (
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{t('faq.title')}</h2>
          {limit && (
            <Link to="/faq" className="text-sm font-semibold text-yu hover:underline">{t('faq.more')} →</Link>
          )}
        </div>
      )}
      <div className="mt-5">
        <UnderlineTabs items={tabs} value={category} onChange={setCategory} label={t('faq.title')} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((item) => {
          const { q, a } = faqText(item, t, lang);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpen(item)}
              className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-yu-dark hover:shadow-lg hover:ring-2 hover:ring-yu-dark focus-visible:ring-[3px] active:ring-[3px] active:ring-yu-dark"
            >
              <div className="w-full rounded-xl bg-slate-50 p-4 sm:p-5">
                <p className="line-clamp-2 text-[17px] font-bold leading-snug text-slate-900">{q}</p>
                <p className="mt-3 flex gap-2 text-[15px] leading-relaxed text-slate-700">
                  <span className="shrink-0 font-bold text-slate-500">A.</span>
                  <span className="line-clamp-2 whitespace-pre-line">{a}</span>
                </p>
              </div>
              <div className="mt-auto w-full px-1">
                <CardFooter item={item} />
              </div>
            </button>
          );
        })}
      </div>

      {open && <FaqModal item={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
