import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { findDepartment, useDepartments } from '../hooks/useDepartments';
import LocalizedText from '../components/LocalizedText';
import AdmissionBadges from '../components/AdmissionBadges';
import CoreTags from '../components/CoreTags';
import SaveButton from '../components/SaveButton';
import KoreanLevel from '../components/KoreanLevel';
import { imageOf, imagePositionOf } from '../utils/fields';
import { dedupeLocalized, mapLocalized, tidy, titleAndBody } from '../utils/text';

/** "짧은 제목\n설명" 형태 글을 굵은 제목 + 설명으로 표시 (언어마다 따로 나눔) */
function TitledText({ text }) {
  const title = mapLocalized(text, (s) => titleAndBody(s).title);
  const body = mapLocalized(text, (s) => titleAndBody(s).body);
  const hasTitle = Object.values(title ?? {}).some(Boolean);
  return (
    <>
      {hasTitle && <LocalizedText as="p" text={title} className="font-bold text-slate-900" showBadge={false} />}
      <LocalizedText as="p" text={body} className={`whitespace-pre-line text-slate-700 ${hasTitle ? 'mt-1' : ''}`} />
    </>
  );
}
import { formatDate } from '../utils/localize';
import { SOURCE_LANG } from '../i18n/languages';

function AdmissionInfo({ admission }) {
  const { t } = useTranslation();
  if (!admission) return null;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {['freshman', 'transfer'].map((track) => {
        const info = admission[track];
        return (
          <div
            key={track}
            className={`rounded-lg border p-4 ${info ? 'border-yu/30 bg-yu-light/50' : 'border-slate-200 bg-slate-50 text-slate-400'}`}
          >
            <h3 className="font-semibold">
              {t(`admission.${track}`)}
              {info?.years && (
                <span className="ml-2 text-sm font-normal text-slate-600">
                  ({info.years.map((n) => t('department.yearN', { n })).join(' · ')})
                </span>
              )}
            </h3>
            {!info && <p className="mt-1 text-sm">{t('admission.notAvailable')}</p>}
            {info && (
              <>
                <p className="mt-1 text-sm text-slate-600">
                  {info.majors.length ? t('admission.majorsOnly') : t('admission.wholeDepartment')}
                </p>
                {info.majors.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 text-sm">
                    {info.majors.map((m) => <li key={m.ko}><LocalizedText text={m} /></li>)}
                  </ul>
                )}
                {info.special && (
                  <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                    {t('admission.special')}
                  </p>
                )}
                <LocalizedText as="p" text={info.note} className="mt-2 text-xs text-slate-600" />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, children, show = true }) {
  if (!show) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold text-yu-dark">{title}</h2>
      {children}
    </section>
  );
}

export default function DepartmentDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { data, loading } = useDepartments();

  if (loading) return <p className="p-8 text-center">{t('common.loading')}</p>;
  const found = findDepartment(data, id);
  if (!found) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-slate-600">{t('department.notFound')}</p>
        <Link to="/departments" className="mt-4 inline-block text-yu underline">{t('nav.departments')}</Link>
      </div>
    );
  }
  const { college, department: d } = found;
  const lang = i18n.resolvedLanguage;
  const hasDetail = !!(d.description?.ko || d.majorGuide?.ko || d.curriculum.length || d.careers.length);
  const related = college.departments.filter((x) => x.id !== d.id);
  const date = formatDate(data.meta?.crawledAt, lang);
  const photo = imageOf(d);
  // 중복 수집된 항목 제거 ("제목+내용"과 "내용만"이 함께 들어온 경우)
  const fields = dedupeLocalized(d.fields);
  const certificates = dedupeLocalized(d.certificates);
  const programs = dedupeLocalized(d.programs);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/departments" className="text-sm text-yu">← {t('department.backToList')}</Link>
      <LocalizedText as="p" text={college.name} className="mt-4 text-sm text-slate-500" showBadge={false} />
      <LocalizedText as="h1" text={d.name} className="text-3xl font-bold" showBadge={false} />
      {/* 원문(한국어) 이름: 공식 사이트·모집요강과 대조할 수 있게 다른 언어 화면에서만 표시 */}
      {lang !== SOURCE_LANG && <p className="text-slate-500" lang={SOURCE_LANG}>{d.name[SOURCE_LANG]}</p>}
      <AdmissionBadges admission={d.admission} className="mt-2" />
      <LocalizedText as="p" text={d.slogan} className="mt-3 text-lg text-slate-700" />
      <CoreTags department={d} size="lg" className="mt-3" />
      {
        <div className="mt-4 flex flex-wrap gap-2">
          <SaveButton department={d} variant="pill" />
          {d.links.homepage && (
            <a
              href={d.links.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-yu-dark px-4 py-2.5 text-sm font-bold text-white hover:bg-yu"
            >
              🏠 {t('department.homepage')} ↗
            </a>
          )}
          {d.links.official && (
            <a
              href={d.links.official}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-yu-dark hover:text-yu-dark"
            >
              {t('department.official')} ↗
            </a>
          )}
        </div>
      }
      {photo && (
        <img
          src={photo}
          alt=""
          className="mt-6 aspect-[16/7] w-full rounded-2xl object-cover"
          style={{ objectPosition: imagePositionOf(d) }}
        />
      )}

      <Section title={t('admission.title')} show={!!d.admission}>
        <AdmissionInfo admission={d.admission} />
      </Section>

      <Section title={t('korean.title')} show={!!d.admission}>
        <KoreanLevel department={d} />
      </Section>

      {/* 등록금·장학금 모의 계산으로 이동 (이 학과가 미리 선택됨) */}
      <Link
        to={`/tuition?dept=${d.id}`}
        className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-5 py-4 transition hover:bg-emerald-100"
      >
        <span className="min-w-0">
          <span className="block font-bold text-emerald-900">💰 {t('tuition.ctaTitle')}</span>
          <span className="mt-0.5 block text-sm text-emerald-800">{t('tuition.ctaText')}</span>
        </span>
        <span aria-hidden className="shrink-0 text-xl text-emerald-700">→</span>
      </Link>

      {!hasDetail && (
        <Section title={t('department.description')}>
          <p className="text-slate-600">{t('department.noDetail')}</p>
          <LocalizedText as="p" text={college.description} className="mt-3 text-sm leading-relaxed text-slate-600" />
        </Section>
      )}

      {/* 본문: 원문의 문장 중간 줄바꿈을 정리(tidy)해서 표시 */}
      <Section title={t('department.description')} show={!!d.description?.ko}>
        <LocalizedText as="p" text={mapLocalized(d.description, tidy)} className="whitespace-pre-line text-[16px] leading-[1.8] text-slate-800" />
      </Section>

      <Section title={t('department.majorGuide')} show={!!d.majorGuide?.ko}>
        <LocalizedText as="p" text={mapLocalized(d.majorGuide, tidy)} className="whitespace-pre-line text-[16px] leading-[1.8] text-slate-800" />
      </Section>

      <Section title={t('department.majors')} show={d.majors.length > 0}>
        <ul className="flex flex-wrap gap-2">
          {d.majors.map((m) => (
            <li key={m.name.ko} className="rounded-lg bg-slate-100 px-3 py-1.5 text-[15px] leading-snug">
              <LocalizedText text={m.name} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t('department.fields')} show={fields.length > 0}>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {fields.map((f) => (
            <li key={f.ko} className="rounded-lg bg-yu-light px-3.5 py-2.5 text-[15px] leading-relaxed">
              <LocalizedText text={mapLocalized(f, tidy)} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t('department.curriculum')} show={d.curriculum.length > 0}>
        <ol className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {d.curriculum.map((c, i) => (
            // 휴대폰: 학년 아래에 내용 / 넓은 화면: 학년 옆에 내용 (학년 칸 너비를 맞춰 줄이 가지런하게)
            <li key={i} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4">
              <span className="shrink-0 text-[15px] font-bold text-yu-dark sm:w-24">
                {c.year ? t('department.yearN', { n: c.year }) : <LocalizedText text={mapLocalized(c.label, tidy)} />}
              </span>
              <LocalizedText text={mapLocalized(c.text, tidy)} className="min-w-0 whitespace-pre-line text-[15px] leading-relaxed text-slate-800" />
            </li>
          ))}
        </ol>
      </Section>

      <Section title={t('department.careers')} show={d.careers.length > 0}>
        <ul className="space-y-3">
          {d.careers.map((c, i) => (
            <li key={i} className="rounded-xl border border-slate-200 p-4">
              <LocalizedText as="h3" text={mapLocalized(c.category, tidy)} className="text-[16px] font-bold text-slate-900" />
              <LocalizedText as="p" text={mapLocalized(c.detail, tidy)} className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-slate-700" />
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t('department.certificates')} show={certificates.length > 0}>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {certificates.map((c) => (
            <li key={c.ko} className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-[15px] leading-relaxed">
              <TitledText text={c} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t('department.programs')} show={programs.length > 0}>
        <ul className="space-y-3">
          {programs.map((p) => (
            <li key={p.ko} className="rounded-xl bg-slate-50 p-4 text-[15px] leading-relaxed">
              <TitledText text={p} />
            </li>
          ))}
        </ul>
      </Section>

      <div className="mt-10 flex flex-wrap gap-3 border-t pt-6 text-sm">
        {d.links.official && (
          <a href={d.links.official} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-yu px-4 py-2 text-white">
            {t('department.official')} ↗
          </a>
        )}
        {d.links.homepage && (
          <a href={d.links.homepage} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-yu px-4 py-2 text-yu">
            {t('department.homepage')} ↗
          </a>
        )}
        {d.phone && <span className="px-2 py-2 text-slate-600">{t('department.phone')}: {d.phone}</span>}
      </div>
      {date && <p className="mt-4 text-xs text-slate-500">{t('department.sourceNote', { date })}</p>}

      <Section title={t('department.relatedTitle')} show={related.length > 0}>
        <ul className="flex flex-wrap gap-2">
          {related.map((x) => (
            <li key={x.id}>
              <Link
                to={`/department/${x.id}`}
                className="inline-block rounded-full border px-3 py-1.5 text-sm hover:border-yu hover:text-yu"
              >
                <LocalizedText text={x.name} showBadge={false} />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <div className="mt-10 rounded-xl bg-yu-light p-5 text-center">
        <p className="text-sm text-slate-700">{t('department.recommendCta')}</p>
        <Link to="/recommend" className="mt-3 inline-block rounded-lg bg-yu px-4 py-2 text-sm font-semibold text-white">
          {t('home.ctaRecommend')}
        </Link>
      </div>
    </article>
  );
}
