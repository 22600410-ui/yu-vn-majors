import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';
import Home from './pages/Home';
import DepartmentDetail from './pages/DepartmentDetail';

// GitHub Pages는 SPA 경로 rewrite를 지원하지 않으므로 HashRouter 사용 (/#/department/me)
export default function App() {
  const { t } = useTranslation();
  return (
    <HashRouter>
      <header className="bg-yu text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/">
            <h1 className="text-lg font-bold sm:text-xl">{t('app.title')}</h1>
            <p className="text-xs text-white/80 sm:text-sm">{t('app.subtitle')}</p>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="min-h-[70vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/department/:id" element={<DepartmentDetail />} />
        </Routes>
      </main>

      <footer className="border-t bg-slate-50 py-6 text-center text-xs text-slate-500">
        {t('app.footerSource')} —{' '}
        <a className="underline" href="https://www.yu.ac.kr/main/academics/university.do" target="_blank" rel="noopener noreferrer">
          yu.ac.kr
        </a>
      </footer>
    </HashRouter>
  );
}
