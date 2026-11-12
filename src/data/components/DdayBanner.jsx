import { useTranslation } from 'react-i18next';
import LocalizedText from './LocalizedText';
import schedule from '../data/schedule.json';
import { formatDate } from '../utils/localize';

const DAY = 24 * 60 * 60 * 1000;

/** 한국 시간 기준 오늘 날짜(자정) — 학생이 베트남에 있어도 학교 일정(한국 날짜)과 맞춰 계산 */
function todayInKorea() {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate());
}
const dayOf = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

/** 앞으로 남은 일정 중 가장 가까운 것 { event, phase: 'before'|'open', days } */
export function nextEvent(events = schedule.events) {
  const today = todayInKorea();
  const list = events
    .map((e) => {
      const start = dayOf(e.start);
      const end = dayOf(e.end ?? e.start);
      if (today > end) return null; // 지난 일정
      return today < start
        ? { event: e, phase: 'before', days: Math.round((start - today) / DAY), at: start }
        : { event: e, phase: 'open', days: Math.round((end - today) / DAY), at: end };
    })
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  return list[0] ?? null;
}

/** 홈 상단 입학 일정 D-day 띠 (남은 일정이 없으면 표시하지 않음) */
export default function DdayBanner({ data = schedule }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const next = nextEvent(data.events);
  if (!next) return null;
  const { event, phase, days } = next;
  const open = phase === 'open';
  const dday = days === 0 ? 'D-DAY' : `D-${days}`;
  const range = [event.start, event.end].filter(Boolean).map((d) => formatDate(`${d}T12:00:00+09:00`, lang)).join(' ~ ');

  return (
    <a
      href={data.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-white transition sm:gap-5 sm:px-6 sm:py-4 ${
        open ? 'bg-rose-600 hover:bg-rose-700' : 'bg-yu-dark hover:bg-yu'
      }`}
    >
      <span className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-xl font-extrabold tabular-nums text-slate-900 sm:text-2xl">{dday}</span>
      <span className="min-w-0 flex-1">
        <LocalizedText as="span" text={data.term} className="block text-xs text-white/80 sm:text-sm" showBadge={false} />
        <span className="block text-[15px] font-bold leading-snug sm:text-lg">
          <LocalizedText text={event.label} showBadge={false} /> {open ? t('dday.untilEnd') : t('dday.untilStart')}
        </span>
        <span className="block text-xs text-white/85 sm:text-sm">{range}</span>
      </span>
      <span className="hidden shrink-0 text-sm font-semibold text-white/90 sm:block">{t('dday.more')} ↗</span>
    </a>
  );
}
