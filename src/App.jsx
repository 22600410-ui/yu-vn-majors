import { useEffect, useState } from 'react';
import { HashRouter, Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useDepartments } from './hooks/useDepartments';
import { formatDate } from './utils/localize';
import Home from './pages/Home';
import Departments from './pages/Departments';
import DepartmentDetail from './pages/DepartmentDetail';
import Recommend from './pages/Recommend';
import Faq from './pages/Faq';
import MajorTest from './pages/MajorTest';
import site from './data/site.json';
import { ChatProvider, useChat } from './components/RecommenderChat';
import { NoticeProvider, SafeRoutes } from './components/Notice';

const NAV = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/departments', key: 'nav.departments' },
  { to: '/recommend', key: 'nav.recommend' },
  { to: '/test', key: 'nav.test' },
  { to: '/faq', key: 'nav.faq' },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  // 중괄호 필수: 최신 크롬의 window.scrollTo 는 값을 돌려주는데, 그 값을 effect가 반환하면
  // React가 '정리 함수'로 착각해 페이지 이동 때 화면이 멈춤 → 아무것도 반환하지 않게 함
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** 로고: src/data/site.json 에 파일 이름이 있으면 그 이미지, 없으면 'YU' 배지 */
function Logo() {
  if (site.logo) {
    return (
      <img
        src={`${import.meta.env.BASE_URL}images/${site.logo}`}
        alt={site.logoAlt}
        className="h-10 w-auto max-w-[120px] shrink-0 object-contain"
      />
    );
  }
  return (
    <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yu-dark text-sm font-extrabold tracking-tight text-white">
      YU
    </span>
  );
}

function SearchBox({ className = '' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { open: openChat } = useChat();
  const [q, setQ] = useState('');
  const submit = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/departments?q=${encodeURIComponent(q.trim())}` : '/departments');
  };
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <form onSubmit={submit} role="search" className="flex min-w-0 flex-1 items-center rounded-full border-2 border-yu bg-white pl-4 pr-1 focus-within:ring-4 focus-within:ring-yu/15">
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-yu" fill="none" stroke="currentColor" strokeWidth="2.4">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('header.searchPlaceholder')}
          aria-label={t('header.searchPlaceholder')}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </form>
      <button
        type="button"
        onClick={openChat}
        className="shrink-0 rounded-full bg-gradient-to-r from-yu to-sky-500 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110 sm:px-5 sm:text-base"
      >
        ✦ {t('header.aiButton')}
      </button>
    </div>
  );
}

function Header() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_rgb(226_232_240)]">
      {/* 1줄: 로고 · 큰 검색창 · AI 추천 · 언어 */}
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <Logo />
          <span className="min-w-0 leading-tight">
            <span className="block text-[15px] font-extrabold text-slate-900 sm:text-base">Yeungnam University</span>
            <span className="block truncate text-xs text-slate-600 sm:text-[13px]">Department Finder for Vietnamese Students</span>
          </span>
        </Link>
        <SearchBox className="hidden flex-1 md:flex" />
        <div className="ml-auto md:ml-0">
          <LanguageSwitcher />
        </div>
      </div>
      {/* 모바일: 검색창 별도 줄 */}
      <div className="px-4 pb-3 md:hidden">
        <SearchBox />
      </div>
      {/* 2줄: 큰 글씨 메뉴 */}
      <div className="border-t border-slate-100">
        <nav className="mx-auto flex max-w-6xl items-center gap-6 overflow-x-auto px-4 sm:gap-9">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `relative shrink-0 whitespace-nowrap py-3.5 text-base font-bold transition sm:text-[17px] ${
                  isActive
                    ? 'text-yu-dark after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-yu-dark'
                    : 'text-slate-800 hover:text-yu'
                }`
              }
            >
              {t(n.key)}
            </NavLink>
          ))}
          <Link to="/faq" className="ml-auto hidden shrink-0 text-sm font-semibold text-yu hover:underline lg:block">
            {t('header.helpLink')} →
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  const { t, i18n } = useTranslation();
  const { data } = useDepartments();
  const date = formatDate(data?.meta?.crawledAt, i18n.resolvedLanguage);
  return (
    <footer className="border-t bg-slate-50 px-4 py-10 text-center text-sm leading-relaxed text-slate-600">
      <p className="mx-auto max-w-2xl">{t('app.disclaimer')}</p>
      <p className="mt-2">
        {t('app.footerSource')} —{' '}
        <a className="underline" href="https://www.yu.ac.kr/main/academics/university.do" target="_blank" rel="noopener noreferrer">
          yu.ac.kr
        </a>
        {date && <> · {t('app.lastUpdated', { date })}</>}
      </p>
    </footer>
  );
}

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="px-4 py-20 text-center">
      <p className="text-slate-600">{t('common.notFound')}</p>
      <Link to="/" className="mt-4 inline-block text-yu underline">{t('common.goHome')}</Link>
    </div>
  );
}

// GitHub Pages는 SPA 경로 rewrite를 지원하지 않으므로 HashRouter 사용 (/#/department/me)
export default function App() {
  return (
    <HashRouter>
      <NoticeProvider>
        <ChatProvider>
          <ScrollToTop />
          <Header />
          <main className="min-h-[70vh]">
            {/* 준비 중 페이지 차단 + 오류가 나면 직전 화면으로 되돌리는 안전장치 */}
            <SafeRoutes>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/departments" element={<Departments />} />
                <Route path="/department/:id" element={<DepartmentDetail />} />
                <Route path="/recommend" element={<Recommend />} />
                <Route path="/faq" element={<Faq />} />
                <Route path="/test" element={<MajorTest />} />
                <Route path="/test/result/:code" element={<MajorTest />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SafeRoutes>
          </main>
          <Footer />
        </ChatProvider>
      </NoticeProvider>
    </HashRouter>
  );
}
