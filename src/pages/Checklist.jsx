import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LocalizedText from '../components/LocalizedText';
import checklist from '../data/checklist.json';
import { useChecklistState } from '../utils/saved';

const TRACKS = ['freshman', 'transfer'];

/** 한 항목: 체크박스 + 내용 + 도움말 + 출처 표시 */
function Item({ item, checked, onToggle }) {
  const { t } = useTranslation();
  return (
    <li className={`rounded-xl border-2 transition ${checked ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <label className="flex cursor-pointer gap-3 p-4">
        <input type="checkbox" checked={checked} onChange={onToggle} className="mt-0.5 h-6 w-6 shrink-0 accent-emerald-600" />
        <span className="min-w-0 flex-1">
          <LocalizedText
            as="span"
            text={item.text}
            className={`block text-[16px] font-bold leading-snug ${checked ? 'text-slate-500 line-through decoration-2' : 'text-slate-900'}`}
          />
          {item.hint && <LocalizedText as="span" text={item.hint} className="mt-1 block text-sm leading-relaxed text-slate-600" />}
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${item.official ? 'bg-yu-light text-yu-dark' : 'bg-slate-100 text-slate-600'}`}
            >
              {item.official ? t('faq.officialBadge') : t('checklist.generalBadge')}
            </span>
          </span>
        </span>
      </label>
      {(item.faq || item.link) && (
        <div className="-mt-2 px-4 pb-3 pl-[3.25rem]">
          <Link to={item.link ?? '/faq'} className="text-sm font-semibold text-yu hover:underline">
            {item.link ? t('checklist.goDepartments') : t('checklist.seeFaq')} →
          </Link>
        </div>
      )}
    </li>
  );
}

export default function Checklist() {
  const { t } = useTranslation();
  const { track, checked, setTrack, toggle, reset } = useChecklistState();

  // 고른 입학 유형에 해당하는 항목만
  const groups = checklist.groups
    .map((g) => ({ ...g, items: g.items.filter((i) => i.tracks.includes(track)) }))
    .filter((g) => g.items.length);
  const keyOf = (item) => `${track}:${item.id}`; // 신입학·편입학 체크 상태를 따로 저장
  const allKeys = groups.flatMap((g) => g.items.map(keyOf));
  const done = allKeys.filter((k) => checked[k]).length;
  const percent = allKeys.length ? Math.round((done / allKeys.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-8">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{t('checklist.title')}</h1>
      <p className="mt-2 text-[15px] text-slate-600">{t('checklist.intro')}</p>

      {/* 입학 유형 고르기 */}
      <div className="mt-6 grid grid-cols-2 gap-2" role="group" aria-label={t('admission.filterLabel')}>
        {TRACKS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTrack(k)}
            aria-pressed={track === k}
            className={`rounded-xl border-2 px-4 py-3 text-[16px] font-bold transition ${
              track === k ? 'border-yu-dark bg-yu-dark text-white ring-[3px] ring-yu-dark/25' : 'border-slate-200 bg-white text-slate-800 hover:border-yu-dark'
            }`}
          >
            {t(`admission.${k}`)}
          </button>
        ))}
      </div>

      {/* 진행률 */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[15px] font-bold text-slate-900">
            {t('checklist.progress', { done, total: allKeys.length })}
          </p>
          <p className={`text-2xl font-extrabold ${percent === 100 ? 'text-emerald-600' : 'text-yu-dark'}`}>{percent}%</p>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-full rounded-full transition-all ${percent === 100 ? 'bg-emerald-500' : 'bg-yu-dark'}`} style={{ width: `${percent}%` }} />
        </div>
        {percent === 100 && <p className="mt-2 text-sm font-semibold text-emerald-700">🎉 {t('checklist.complete')}</p>}
      </div>

      {groups.map((g) => (
        <section key={g.id} className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-yu-dark">
            <span aria-hidden>{g.icon}</span>
            <LocalizedText text={g.label} showBadge={false} />
          </h2>
          <ul className="mt-3 space-y-2.5">
            {g.items.map((item) => (
              <Item key={item.id} item={item} checked={!!checked[keyOf(item)]} onToggle={() => toggle(keyOf(item))} />
            ))}
          </ul>
        </section>
      ))}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => reset(allKeys)}
          className="rounded-xl border-2 border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:border-yu-dark"
        >
          ↺ {t('checklist.reset')}
        </button>
        <span className="text-sm text-slate-500">{t('checklist.savedNote')}</span>
      </div>

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-[15px] leading-relaxed text-amber-950">
        <p className="font-bold">{t('home.noticeTitle')}</p>
        <p className="mt-1">{t('checklist.disclaimer')}</p>
        <a href="mailto:admission@yu.ac.kr" className="mt-2 inline-block font-semibold text-amber-900 underline">
          ✉ admission@yu.ac.kr
        </a>
      </div>
    </div>
  );
}
