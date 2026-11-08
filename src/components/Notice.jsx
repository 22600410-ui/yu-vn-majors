import { Component, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import site from '../data/site.json';

/* ------------------------------------------------------------------ *
 * '준비 중' 기능 관리 (src/data/site.json 의 comingSoon)
 * ------------------------------------------------------------------ */
const COMING_SOON = new Set(site.comingSoon ?? []);
const ROUTE_FEATURE = { '/faq': 'faq', '/test': 'test', '/recommend': 'recommend', '/departments': 'departments' };

export const isComingSoon = (feature) => COMING_SOON.has(feature);

/** 주소(#/faq, /test/result/IA …)가 준비 중 기능이면 그 이름, 아니면 null */
export function comingSoonFeatureOf(path = '') {
  const clean = path.replace(/^#/, '').split('?')[0];
  const hit = Object.entries(ROUTE_FEATURE).find(([prefix]) => clean === prefix || clean.startsWith(`${prefix}/`));
  return hit && COMING_SOON.has(hit[1]) ? hit[1] : null;
}

/* ------------------------------------------------------------------ *
 * 화면 아래쪽에 잠깐 뜨는 안내(토스트)
 * ------------------------------------------------------------------ */
const NoticeContext = createContext({ notify: () => {}, comingSoon: () => {} });
export const useNotice = () => useContext(NoticeContext);

export function NoticeProvider({ children }) {
  const { t } = useTranslation();
  const [message, setMessage] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((text) => {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2600);
  }, []);
  const comingSoon = useCallback(() => notify(t('notice.comingSoon')), [notify, t]);

  // 준비 중 페이지로 가는 모든 링크를 한곳에서 막음 (메뉴·카드·본문 링크 모두)
  // 문서 '캡처' 단계에서 먼저 잡아서 React Router 가 페이지를 바꾸기 전에 멈춤 → 지금 페이지에 그대로 머무름
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      const hashIndex = href.indexOf('#/');
      if (hashIndex === -1) return;
      if (comingSoonFeatureOf(href.slice(hashIndex))) {
        e.preventDefault();
        e.stopPropagation();
        comingSoon();
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [comingSoon]);

  const value = useMemo(() => ({ notify, comingSoon }), [notify, comingSoon]);
  return (
    <NoticeContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4">
        {message && (
          <p className="rounded-full bg-slate-900/90 px-5 py-3 text-[15px] font-semibold text-white shadow-lg">
            {message}
          </p>
        )}
      </div>
    </NoticeContext.Provider>
  );
}

/* ------------------------------------------------------------------ *
 * 안전장치: 주소창으로 준비 중 페이지에 직접 들어오거나, 화면을 그리다 오류가 나면
 * 하얀 화면 대신 직전 화면(없으면 홈)으로 되돌리고 안내를 띄움
 * ------------------------------------------------------------------ */
class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(error); // eslint-disable-line no-console
    this.props.onError();
  }

  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function SafeRoutes({ children }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { notify, comingSoon } = useNotice();
  const lastGood = useRef('/');
  const failed = useRef(false);
  const path = location.pathname + location.search;
  const blocked = comingSoonFeatureOf(location.pathname);

  useEffect(() => {
    if (blocked) {
      comingSoon();
      navigate(lastGood.current === path ? '/' : lastGood.current, { replace: true });
      return;
    }
    if (failed.current) {
      failed.current = false;
      return;
    }
    lastGood.current = path;
  }, [path, blocked, comingSoon, navigate]);

  const onError = () => {
    failed.current = true;
    notify(t('notice.recovered'));
    navigate(lastGood.current === path ? '/' : lastGood.current, { replace: true });
  };

  if (blocked) return null;
  return (
    <Boundary resetKey={path} onError={onError}>
      {children}
    </Boundary>
  );
}
