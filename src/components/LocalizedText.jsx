import { useTranslation } from 'react-i18next';
import { localize } from '../utils/localize';

/** LocalizedText를 현재 언어로 렌더링하고, 다른 언어로 대체된 경우 작은 배지를 표시 */
export default function LocalizedText({ text, as: Tag = 'span', className = '', showBadge = true }) {
  const { t, i18n } = useTranslation();
  const { value, lang, isFallback } = localize(text, i18n.resolvedLanguage);
  if (!value) return null;
  return (
    <Tag className={className} lang={lang ?? undefined}>
      {value}
      {isFallback && showBadge && (
        <span
          lang={i18n.resolvedLanguage}
          className="ml-2 inline-block rounded bg-amber-100 px-1.5 py-0.5 align-middle text-[10px] font-medium text-amber-800"
        >
          {t('translation.badge', { lang: t(`languageNames.${lang}`) })}
        </span>
      )}
    </Tag>
  );
}
