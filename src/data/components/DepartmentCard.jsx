import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LocalizedText from './LocalizedText';
import AdmissionBadges from './AdmissionBadges';
import CoreTags from './CoreTags';
import { SOURCE_LANG } from '../i18n/languages';

export default function DepartmentCard({ department, children }) {
  const { t, i18n } = useTranslation();
  return (
    <Link
      to={`/department/${department.id}`}
      className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-yu hover:shadow"
    >
      <LocalizedText as="h3" text={department.name} className="font-semibold text-slate-900" showBadge={false} />
      {/* 다른 언어 화면에서는 원문(한국어) 이름을 함께 보여 줘 공식 사이트와 대조하기 쉽게 */}
      {i18n.resolvedLanguage !== SOURCE_LANG && (
        <p className="text-xs text-slate-500" lang={SOURCE_LANG}>{department.name[SOURCE_LANG]}</p>
      )}
      <AdmissionBadges admission={department.admission} className="mt-2" />
      <LocalizedText as="p" text={department.slogan} className="mt-2 line-clamp-2 text-sm text-slate-600" />
      <CoreTags department={department} className="mt-3" />
      {children}
      <span className="mt-auto pt-3 text-sm font-medium text-yu">{t('department.viewDetail')} →</span>
    </Link>
  );
}
