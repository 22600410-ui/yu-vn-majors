import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n/languages';

/** 언어가 3개 이하면 버튼, 그보다 많으면 드롭다운 (흰 헤더용 스타일) */
export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage;

  if (LANGUAGES.length > 3) {
    return (
      <label className="flex items-center text-sm">
        <span className="sr-only">{t('lang.label')}</span>
        <select
          value={current}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-700"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div role="group" aria-label={t('lang.label')} className="flex shrink-0 rounded-lg bg-slate-100 p-0.5 text-xs sm:text-sm">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.code}
          onClick={() => i18n.changeLanguage(l.code)}
          aria-pressed={current === l.code}
          className={`whitespace-nowrap rounded-md px-2.5 py-1 transition ${
            current === l.code ? 'bg-white font-semibold text-yu shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
