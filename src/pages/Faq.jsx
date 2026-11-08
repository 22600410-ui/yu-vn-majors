import { useTranslation } from 'react-i18next';
import FaqSection from '../components/FaqSection';
import { useChat } from '../components/RecommenderChat';
import { isComingSoon } from '../components/Notice';

export default function Faq() {
  const { t } = useTranslation();
  const { open } = useChat();
  const chatReady = !isComingSoon('chat');
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{t('faq.title')}</h1>
      <p className="mt-2 text-[15px] text-slate-600">{chatReady ? t('faq.intro') : t('faq.introNoChat')}</p>
      <div className="mt-6">
        <FaqSection title={false} />
      </div>
      <div className="mt-12 rounded-2xl bg-yu-light p-6 text-center">
        <p className="text-lg font-bold text-slate-900">{t('faq.notFoundTitle')}</p>
        {chatReady ? (
          <>
            <p className="mt-1 text-[15px] text-slate-700">{t('faq.notFoundText')}</p>
            <button type="button" onClick={open} className="mt-4 rounded-xl bg-yu px-6 py-3 font-bold text-white hover:bg-yu-dark">
              ✦ {t('faq.askAi')}
            </button>
          </>
        ) : (
          <>
            <p className="mt-1 text-[15px] text-slate-700">{t('faq.contactText')}</p>
            <a href="mailto:admission@yu.ac.kr" className="mt-4 inline-block rounded-xl bg-yu-dark px-6 py-3 font-bold text-white hover:bg-yu">
              ✉ admission@yu.ac.kr
            </a>
          </>
        )}
      </div>
    </div>
  );
}
