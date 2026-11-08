import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LocalizedText from './LocalizedText';
import AdmissionBadges from './AdmissionBadges';

export default function DepartmentCard({ department }) {
  const { t } = useTranslation();
  return (
    <Link
      to={`/department/${department.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-yu hover:shadow"
    >
      <LocalizedText as="h3" text={department.name} className="font-semibold text-slate-900" showBadge={false} />
      {/* 보조 언어(한국어) 이름을 함께 보여 주면 학생이 공식 사이트와 대조하기 쉽습니다 */}
      <p className="text-xs text-slate-500" lang="ko">{department.name.ko}</p>
      <AdmissionBadges admission={department.admission} className="mt-2" />
      <LocalizedText as="p" text={department.slogan} className="mt-2 line-clamp-2 text-sm text-slate-600" />
      {department.tags?.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1">
          {department.tags.slice(0, 4).map((tag) => (
            <li key={tag.ko} className="rounded-full bg-yu-light px-2 py-0.5 text-xs text-yu-dark">
              #<LocalizedText text={tag} showBadge={false} />
            </li>
          ))}
        </ul>
      )}
      <span className="mt-3 inline-block text-sm font-medium text-yu">{t('department.viewDetail')} →</span>
    </Link>
  );
}
