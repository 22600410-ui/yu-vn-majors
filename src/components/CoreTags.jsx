import { useTranslation } from 'react-i18next';
import { tagsOf } from '../utils/keywords';
import { tr } from '../utils/localize';

/** 학과 핵심 해시태그 (예: #중국어 #중국문화) — src/data/keywords.json */
export default function CoreTags({ department, className = '', size = 'sm' }) {
  const { i18n } = useTranslation();
  const tags = tagsOf(department);
  if (tags.length === 0) return null;
  const text = size === 'lg' ? 'text-[15px] px-3 py-1' : 'text-[13px] px-2 py-0.5';
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((tag) => (
        <li key={tag.ko} className={`rounded-md bg-yu-light font-semibold text-yu-dark ${text}`}>
          #{tr(tag, i18n.resolvedLanguage)}
        </li>
      ))}
    </ul>
  );
}
