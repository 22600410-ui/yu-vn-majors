import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { findDepartment, useDepartments } from '../hooks/useDepartments';
import LocalizedText from '../components/LocalizedText';

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
  const { t } = useTranslation();
  const { data, loading } = useDepartments();

  if (loading) return <p className="p-8 text-center">{t('common.loading')}</p>;
  const found = findDepartment(data, id);
  if (!found) return <p className="p-8 text-center">{t('search.noResult')}</p>;
  const { college, department: d } = found;

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-sm text-yu">← {t('common.back')}</Link>
      <LocalizedText as="p" text={college.name} className="mt-4 text-sm text-slate-500" showBadge={false} />
      <LocalizedText as="h1" text={d.name} className="text-3xl font-bold" showBadge={false} />
      <p className="text-slate-500" lang="ko">{d.name.ko}</p>
      <LocalizedText as="p" text={d.slogan} className="mt-3 text-lg text-slate-700" />

      <Section title={t('department.description')} show={!!d.description?.ko}>
        <LocalizedText as="p" text={d.description} className="whitespace-pre-line leading-relaxed" />
      </Section>

      <Section title={t('department.majorGuide')} show={!!d.majorGuide?.ko}>
        <LocalizedText as="p" text={d.majorGuide} className="whitespace-pre-line leading-relaxed" />
      </Section>

      <Section title={t('department.majors')} show={d.majors.length > 0}>
        <ul className="list-disc pl-5">
          {d.majors.map((m) => <li key={m.name.ko}><LocalizedText text={m.name} /></li>)}
        </ul>
      </Section>

      <Section title={t('department.fields')} show={d.fields.length > 0}>
        <ul className="grid gap-2 sm:grid-cols-2">
          {d.fields.map((f) => (
            <li key={f.ko} className="rounded-lg bg-yu-light px-3 py-2"><LocalizedText text={f} /></li>
          ))}
        </ul>
      </Section>

      <Section title={t('department.curriculum')} show={d.curriculum.length > 0}>
        <ol className="space-y-2">
          {d.curriculum.map((c, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-16 shrink-0 font-semibold text-yu">
                {c.year ? t('department.yearN', { n: c.year }) : <LocalizedText text={c.label} />}
              </span>
              <LocalizedText text={c.text} />
            </li>
          ))}
        </ol>
      </Section>

      <Section title={t('department.careers')} show={d.careers.length > 0}>
        <ul className="space-y-3">
          {d.careers.map((c, i) => (
            <li key={i} className="rounded-lg border border-slate-200 p-3">
              <LocalizedText as="h3" text={c.category} className="font-semibold" />
              <LocalizedText as="p" text={c.detail} className="text-sm text-slate-600" />
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t('department.certificates')} show={d.certificates.length > 0}>
        <ul className="flex flex-wrap gap-2">
          {d.certificates.map((c) => (
            <li key={c.ko} className="rounded-full border px-3 py-1 text-sm"><LocalizedText text={c} /></li>
          ))}
        </ul>
      </Section>

      <Section title={t('department.programs')} show={d.programs.length > 0}>
        <ul className="list-disc space-y-1 pl-5">
          {d.programs.map((p) => <li key={p.ko} className="whitespace-pre-line"><LocalizedText text={p} /></li>)}
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
    </article>
  );
}
