import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LocalizedText from './LocalizedText';
import AdmissionBadges from './AdmissionBadges';
import CoreTags from './CoreTags';
import { fieldOf, imageOf, imagePositionOf, summaryOf } from '../utils/fields';

/** 학과 홈페이지 주소 (없으면 영남대 공식 학과소개 페이지) */
export const homepageOf = (department) => department.links?.homepage || department.links?.official || null;
import { tr } from '../utils/localize';

/** 소개 글 앞부분 2문장 (미리보기용) */
function introOf(department, lang) {
  const text = tr(department.description, lang) || tr(department.majorGuide, lang);
  if (!text) return '';
  return text.split(/(?<=[.!?。])\s+|\n/).filter(Boolean).slice(0, 2).join(' ');
}

/**
 * 마우스를 올렸을 때 펼쳐지는 요약 카드 (데스크톱 lg 이상, 마우스가 있는 기기만)
 * - 카드 2칸 너비로 펼쳐짐. 4열 기준 왼쪽 두 칸은 오른쪽으로, 오른쪽 두 칸은 왼쪽으로 펼쳐 화면 밖으로 나가지 않게 함
 * - 0.25초 머문 뒤에 열려서 마우스를 지나가기만 해도 깜빡이지 않음
 */
function HoverPreview({ department, college, field, side }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const summary = summaryOf(department);
  const intro = introOf(department, lang);
  const summaryText = tr(summary, lang);
  const careers = (department.careers ?? []).slice(0, 3);
  const image = imageOf(department);

  return (
    <div
      aria-hidden
      className={`pointer-events-none invisible absolute top-0 z-30 hidden w-[calc(200%+1.25rem)] scale-95 opacity-0 transition duration-200
        [@media(hover:hover)]:lg:block
        group-hover:pointer-events-auto group-hover:visible group-hover:scale-100 group-hover:opacity-100 group-hover:delay-[250ms]
        ${side === 'left' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}`}
      style={{ minHeight: '100%' }}
    >
      <div
        className="relative flex flex-col overflow-hidden rounded-2xl text-white shadow-2xl ring-[3px] ring-yu-dark"
        style={{ minHeight: 'inherit' }}
      >
        {/* 배경: 학과 사진이 있으면 사진 + 어두운 막, 없으면 남색 그라데이션 */}
        {image ? (
          <>
            <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: imagePositionOf(department) }} />
            <div className="absolute inset-0 bg-gradient-to-b from-[#06213f]/80 to-[#06213f]/95" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-yu-dark via-[#0a3a6e] to-[#06213f]" />
        )}

        <Link to={`/department/${department.id}`} tabIndex={-1} className="relative flex flex-1 flex-col items-center px-8 pb-2 pt-7 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow">{field?.icon ?? '🎓'}</span>
          <p className="mt-3 text-sm font-medium text-white/80">{tr(college.name, lang)}</p>
          <p className="mt-0.5 text-2xl font-extrabold leading-snug">{tr(department.name, lang)}</p>
          <CoreTags department={department} className="mt-2 justify-center [&>li]:bg-white/15 [&>li]:text-white" />
          {summaryText && <p className="mt-3 text-[17px] font-semibold leading-snug">{summaryText}</p>}
          {intro && intro !== summaryText && <p className="mt-3 line-clamp-4 text-[15px] leading-relaxed text-white/90">{intro}</p>}

          {careers.length > 0 && (
            <div className="mt-4 w-full rounded-xl bg-white/10 px-4 py-3 text-left">
              <p className="text-[13px] font-bold text-white/70">{t('department.careers')}</p>
              <ul className="mt-1 space-y-0.5 text-sm">
                {careers.map((c, i) => (
                  <li key={i} className="line-clamp-1">
                    · {tr(c.category, lang) ? <b className="font-semibold">{tr(c.category, lang)}</b> : null}
                    {tr(c.category, lang) ? ' — ' : ''}
                    {tr(c.detail, lang)}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </Link>

        {/* 아래 줄: 지원 유형 · 학과 홈페이지(새 창) · 자세히 보기 */}
        <div className="relative mt-auto flex w-full flex-wrap items-center justify-between gap-3 px-8 pb-6 pt-3">
          <AdmissionBadges admission={department.admission} />
          <div className="flex shrink-0 gap-2">
            {homepageOf(department) && (
              <a
                href={homepageOf(department)}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={-1}
                className="rounded-full border-2 border-white/70 px-4 py-1.5 text-sm font-bold text-white hover:bg-white/15"
              >
                {t('department.homepageShort')} ↗
              </a>
            )}
            <Link to={`/department/${department.id}`} tabIndex={-1} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-yu-dark hover:bg-yu-light">
              {t('department.viewDetail')} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 학과 카드: [썸네일] + [단과대학·학과명] + [핵심 해시태그] + [한 줄 설명] + [자세히 보기]
 * index: 그리드 안 순서 (요약 카드를 펼칠 방향 계산용)
 */
export default function MajorCard({ department, college, index = 0 }) {
  const { t, i18n } = useTranslation();
  const field = fieldOf(department, college);
  const image = imageOf(department);
  const summary = summaryOf(department);
  const name = tr(department.name, i18n.resolvedLanguage);
  const side = index % 4 < 2 ? 'left' : 'right';

  return (
    <div className="group relative h-full hover:z-30 focus-within:z-30">
      <article
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition
          group-hover:border-yu-dark group-hover:ring-2 group-hover:ring-yu-dark
          focus-within:border-yu-dark focus-within:ring-[3px] focus-within:ring-yu-dark active:ring-[3px] active:ring-yu-dark"
      >
        <Link to={`/department/${department.id}`} tabIndex={-1} aria-hidden className="block">
          {image ? (
            <div className="relative">
              <img
                src={image}
                alt=""
                loading="lazy"
                className="aspect-[16/10] w-full object-cover"
                style={{ objectPosition: imagePositionOf(department) }}
              />
              {field && (
                <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm sm:left-4 sm:text-xs">
                  {field.icon} {tr(field.label, i18n.resolvedLanguage)}
                </span>
              )}
            </div>
          ) : (
            // 사진이 없으면 계열 색 + 아이콘 + 학과 이름으로 썸네일 생성
            <div className={`relative flex aspect-[16/10] items-end bg-gradient-to-br p-3 sm:p-4 ${field?.color ?? 'from-slate-400 to-slate-600'}`}>
              <span className="absolute right-3 top-2 text-3xl sm:text-4xl">{field?.icon ?? '🎓'}</span>
              {field && (
                <span className="absolute left-3 top-3 rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-semibold text-white sm:left-4 sm:text-xs">
                  {tr(field.label, i18n.resolvedLanguage)}
                </span>
              )}
              <span className="line-clamp-2 text-[15px] font-extrabold leading-snug text-white drop-shadow sm:text-lg">{name}</span>
            </div>
          )}
        </Link>

        <div className="flex flex-1 flex-col p-3.5 sm:p-4">
          <LocalizedText as="p" text={college.name} className="truncate text-[13px] font-medium text-slate-500" showBadge={false} />
          <h3 className="mt-0.5 text-base font-bold leading-snug text-slate-900 sm:text-[17px]">
            <Link to={`/department/${department.id}`} className="hover:text-yu-dark">
              <LocalizedText text={department.name} showBadge={false} />
            </Link>
          </h3>
          <CoreTags department={department} className="mt-2" />
          <AdmissionBadges admission={department.admission} className="mt-2" />
          {summary && (
            <LocalizedText as="p" text={summary} className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-700 sm:text-[15px]" showBadge={false} />
          )}
          <div className="mt-auto flex gap-2 pt-4">
            <Link
              to={`/department/${department.id}`}
              className="flex flex-1 items-center justify-center rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-yu-dark hover:text-white"
            >
              {t('department.viewDetail')}
            </Link>
            {homepageOf(department) && (
              <a
                href={homepageOf(department)}
                target="_blank"
                rel="noopener noreferrer"
                title={t('department.homepage')}
                className="flex shrink-0 items-center justify-center rounded-xl border-2 border-slate-200 px-2.5 py-2 text-[13px] font-bold text-slate-700 transition hover:border-yu-dark hover:text-yu-dark sm:px-3 sm:text-sm"
              >
                {t('department.homepageShort')} ↗
              </a>
            )}
          </div>
        </div>
      </article>

      <HoverPreview department={department} college={college} field={field} side={side} />
    </div>
  );
}
