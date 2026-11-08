import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGS } from '../i18n';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  return (
    <div role="group" aria-label={t('lang.label')} className="flex rounded-full border border-white/40 p-0.5 text-sm">
      {SUPPORTED_LANGS.map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => i18n.changeLanguage(lng)}
          aria-pressed={i18n.resolvedLanguage === lng}
          className={`rounded-full px-3 py-1 transition ${
            i18n.resolvedLanguage === lng ? 'bg-white text-yu' : 'text-white hover:bg-white/10'
          }`}
        >
          {t(`lang.${lng}`)}
        </button>
      ))}
    </div>
  );
}
