import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDepartments } from '../hooks/useDepartments';
import { recommend, rules } from '../utils/recommend';
import { searchDepartments } from '../utils/search';
import { buildFaqs, faqText, featuredFaqs, matchFaq } from '../utils/faq';
import LocalizedText from './LocalizedText';
import AdmissionBadges from './AdmissionBadges';

/*
 * AI 전공 추천 챗봇 (AI Department Recommender)
 * - 데스크톱(lg 이상): 오른쪽 고정 사이드 패널 / 모바일: 하단 팝업(바텀시트)
 * - 현재 동작: 질문 3개(입학 유형 → 관심 분야 → 희망 진로)에 답하면 규칙 기반으로 추천(utils/recommend.js),
 *   자유 입력은 학과·키워드 검색으로 응답.
 * - 실제 AI(LLM) 대화로 바꾸려면 answerFreeText() 를 서버 API 호출로 교체하세요.
 *   GitHub Pages는 정적 사이트라 API 키를 넣으면 노출되므로, 반드시 별도 서버(예: Cloudflare Workers)를 거쳐야 합니다.
 */

const ChatContext = createContext({ isOpen: false, open: () => {}, close: () => {}, toggle: () => {}, ask: () => {} });
export const useChat = () => useContext(ChatContext);

export function ChatProvider({ children }) {
  const [isOpen, setOpen] = useState(false);
  const [pending, setPending] = useState(null); // 다른 화면(FAQ 등)에서 챗봇에 보낸 질문
  const value = useMemo(
    () => ({
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((v) => !v),
      ask: (text) => {
        setOpen(true);
        setPending({ text, at: Date.now() });
      },
      pending,
      clearPending: () => setPending(null),
    }),
    [isOpen, pending],
  );
  return (
    <ChatContext.Provider value={value}>
      {children}
      <ChatLauncher />
      <ChatPanel />
    </ChatContext.Provider>
  );
}

function ChatLauncher() {
  const { t } = useTranslation();
  const { isOpen, open } = useChat();
  if (isOpen) return null;
  return (
    <button
      type="button"
      onClick={open}
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-yu px-5 py-3 text-sm font-semibold text-white shadow-lg ring-4 ring-white/60 transition hover:bg-yu-dark"
    >
      <span aria-hidden className="text-lg">🤖</span>
      {t('chat.launcher')}
    </button>
  );
}

const firstMessages = () => [
  { id: 1, from: 'bot', key: 'chat.greeting' },
  { id: 2, from: 'bot', key: 'chat.askTrack' },
];

function ChatPanel() {
  const { t, i18n } = useTranslation();
  const { isOpen, close, pending, clearPending } = useChat();
  const { data } = useDepartments();
  const faqs = useMemo(() => buildFaqs(data), [data]);
  const featured = useMemo(() => featuredFaqs(faqs), [faqs]);

  const [messages, setMessages] = useState(firstMessages);
  const [step, setStep] = useState('track'); // track → interests → career → done
  const [answers, setAnswers] = useState({ track: 'unsure', interests: [], career: null });
  const [picked, setPicked] = useState([]); // 관심 분야 선택 중
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const nextId = useRef(3);

  const push = useCallback((...msgs) => {
    setMessages((cur) => [...cur, ...msgs.map((m) => ({ id: nextId.current++, ...m }))]);
  }, []);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isOpen, step]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  const restart = () => {
    setMessages(firstMessages());
    setStep('track');
    setAnswers({ track: 'unsure', interests: [], career: null });
    setPicked([]);
  };

  const chooseTrack = (track) => {
    setAnswers((a) => ({ ...a, track }));
    push({ from: 'user', key: track === 'unsure' ? 'recommend.unsure' : `admission.${track}` }, { from: 'bot', key: 'chat.askInterests', params: { max: rules.maxInterests } });
    setStep('interests');
  };

  const confirmInterests = () => {
    const labels = rules.interests.filter((i) => picked.includes(i.id)).map((i) => i.label);
    setAnswers((a) => ({ ...a, interests: picked }));
    push({ from: 'user', labels }, { from: 'bot', key: 'chat.askCareer' });
    setStep('career');
  };

  const chooseCareer = (careerId) => {
    const career = rules.careers.find((c) => c.id === careerId);
    const final = { ...answers, career: careerId };
    setAnswers(final);
    const results = recommend(data, final, 5);
    push(
      career ? { from: 'user', labels: [career.label] } : { from: 'user', key: 'recommend.careerNone' },
      { from: 'bot', key: results.length ? 'chat.results' : 'recommend.resultsEmpty', results },
    );
    setStep('done');
  };

  // 학과 검색 (가장 정확한 학과 최대 4개 + 비슷한 학과 3개)
  const findDepartments = (text) => {
    const r = searchDepartments(data, text, { similarLimit: 3 });
    const results = [
      ...r.best.slice(0, 4).map((x) => ({ department: x.department, college: x.college, reasons: [] })),
      ...r.similar.map((x) => ({ department: x.department, college: x.college, reasons: x.reason.item ? [{ item: x.reason.item }] : [] })),
    ];
    return { results, topScore: r.best[0]?.score ?? 0 };
  };

  // 자유 입력에 대한 답 (규칙 기반)
  // ① FAQ 질문 문장과 똑같으면 FAQ → ② 학과 이름·핵심 키워드가 분명히 맞으면 학과
  // → ③ FAQ 키워드 → ④ 약하게라도 맞는 학과 → ⑤ 못 찾음
  const answerFreeText = useCallback(
    (text) => {
      const lang = i18n.resolvedLanguage;
      const exactFaq = matchFaq(faqs, text, t, lang, { exactOnly: true });
      if (exactFaq) return [{ from: 'bot', faq: exactFaq }];
      const { results, topScore } = findDepartments(text);
      const found = { from: 'bot', key: 'chat.searchFound', params: { q: text }, results };
      if (topScore >= 45) return [found];
      const faq = matchFaq(faqs, text, t, lang);
      if (faq) return [{ from: 'bot', faq }];
      if (results.length) return [found];
      return [{ from: 'bot', key: 'chat.searchNone', params: { q: text } }];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [faqs, data, i18n.resolvedLanguage],
  );

  const sendQuestion = useCallback(
    (text) => push({ from: 'user', text }, ...answerFreeText(text)),
    [push, answerFreeText],
  );

  const sendText = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendQuestion(text);
  };

  // FAQ 화면 등에서 ask()로 보낸 질문 처리
  useEffect(() => {
    if (pending && data) {
      sendQuestion(pending.text);
      clearPending();
    }
  }, [pending, data, sendQuestion, clearPending]);

  const closeOnMobile = () => {
    if (window.matchMedia('(max-width: 1023px)').matches) close();
  };

  return (
    <>
      {/* 모바일: 뒤 배경 어둡게 */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={close} aria-hidden />}
      <aside
        role="dialog"
        aria-label={t('chat.title')}
        aria-hidden={!isOpen}
        className={`fixed z-50 flex flex-col overflow-hidden bg-white shadow-2xl transition-transform duration-300
          inset-x-0 bottom-0 h-[80vh] rounded-t-2xl
          lg:inset-x-auto lg:bottom-4 lg:right-4 lg:top-4 lg:h-auto lg:w-[380px] lg:rounded-2xl lg:border
          ${isOpen ? 'translate-y-0 lg:translate-x-0' : 'pointer-events-none translate-y-full lg:translate-x-[420px] lg:translate-y-0'}`}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3 bg-yu px-4 py-3 text-white">
          <div>
            <p className="font-semibold">🤖 {t('chat.title')}</p>
            <p className="text-xs text-white/80">{t('chat.subtitle')}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={restart} className="rounded px-2 py-1 text-xs hover:bg-white/10">{t('chat.restart')}</button>
            <button type="button" onClick={close} aria-label={t('chat.close')} className="rounded px-2 py-1 text-lg leading-none hover:bg-white/10">×</button>
          </div>
        </div>

        {/* 대화 */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                  m.from === 'user' ? 'rounded-br-sm bg-yu text-white' : 'rounded-bl-sm border bg-white text-slate-800'
                }`}
              >
                {m.text}
                {m.key && t(m.key, m.params)}
                {m.faq && (
                  <>
                    <p className="text-xs font-bold text-yu">{t('chat.faqLabel')}</p>
                    <p className="mt-1 font-semibold">{faqText(m.faq, t, i18n.resolvedLanguage).q}</p>
                    <p className="mt-1 whitespace-pre-line">{faqText(m.faq, t, i18n.resolvedLanguage).a}</p>
                  </>
                )}
                {m.faq?.related?.length > 0 && !m.results && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {m.faq.related.map(({ department }) => (
                      <li key={department.id}>
                        <Link
                          to={`/department/${department.id}`}
                          onClick={closeOnMobile}
                          className="inline-block rounded-full border px-2.5 py-1 text-xs hover:border-yu hover:text-yu"
                        >
                          <LocalizedText text={department.name} showBadge={false} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {m.labels?.map((l, i) => (
                  <span key={i}>
                    {i > 0 && ', '}
                    <LocalizedText text={l} showBadge={false} />
                  </span>
                ))}
                {m.results?.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {m.results.map((r) => (
                      <li key={r.department.id}>
                        <Link
                          to={`/department/${r.department.id}`}
                          onClick={closeOnMobile}
                          className="block rounded-lg border bg-slate-50 px-3 py-2 hover:border-yu"
                        >
                          <LocalizedText as="p" text={r.college.name} className="text-[11px] text-slate-500" showBadge={false} />
                          <LocalizedText as="p" text={r.department.name} className="font-semibold text-yu-dark" showBadge={false} />
                          <AdmissionBadges admission={r.department.admission} className="mt-1" />
                          {r.reasons.length > 0 && (
                            <p className="mt-1 text-[11px] text-slate-500">
                              {r.reasons.map((x, i) => (
                                <span key={x.item.id}>
                                  {i > 0 && ' · '}
                                  <LocalizedText text={x.item.label} showBadge={false} />
                                </span>
                              ))}
                            </p>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* 빠른 답변 */}
        <div className="max-h-[40%] overflow-y-auto border-t bg-white px-3 py-2">
          {step === 'track' && (
            <div className="flex flex-wrap gap-2">
              {['freshman', 'transfer', 'unsure'].map((k) => (
                <QuickReply key={k} onClick={() => chooseTrack(k)}>
                  {k === 'unsure' ? t('recommend.unsure') : t(`admission.${k}`)}
                </QuickReply>
              ))}
            </div>
          )}
          {step === 'interests' && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {rules.interests.map((i) => {
                  const on = picked.includes(i.id);
                  return (
                    <QuickReply
                      key={i.id}
                      active={on}
                      disabled={!on && picked.length >= rules.maxInterests}
                      onClick={() => setPicked((cur) => (on ? cur.filter((x) => x !== i.id) : [...cur, i.id]))}
                    >
                      <span aria-hidden>{i.icon}</span> <LocalizedText text={i.label} showBadge={false} />
                    </QuickReply>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={confirmInterests}
                disabled={picked.length === 0}
                className="mt-2 w-full rounded-lg bg-yu py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                {t('chat.confirm', { count: picked.length })}
              </button>
            </>
          )}
          {step === 'career' && (
            <div className="flex flex-wrap gap-1.5">
              {rules.careers.map((c) => (
                <QuickReply key={c.id} onClick={() => chooseCareer(c.id)}>
                  <span aria-hidden>{c.icon}</span> <LocalizedText text={c.label} showBadge={false} />
                </QuickReply>
              ))}
              <QuickReply onClick={() => chooseCareer(null)}>{t('recommend.careerNone')}</QuickReply>
            </div>
          )}
          {step === 'done' && (
            <div className="flex flex-wrap gap-2">
              <QuickReply onClick={restart}>↺ {t('chat.restart')}</QuickReply>
              <Link to="/recommend" onClick={closeOnMobile} className="rounded-full border border-yu px-3 py-1.5 text-xs text-yu hover:bg-yu-light">
                {t('nav.recommend')} →
              </Link>
            </div>
          )}
          {(step === 'track' || step === 'done') && featured.length > 0 && (
            <div className="mt-2 border-t pt-2">
              <p className="mb-1.5 text-[11px] font-semibold text-slate-500">{t('chat.faqSuggest')}</p>
              <div className="flex flex-wrap gap-1.5">
                {featured.map((f) => {
                  const q = faqText(f, t, i18n.resolvedLanguage).q;
                  return (
                    <QuickReply key={f.id} onClick={() => sendQuestion(q)}>
                      {q}
                    </QuickReply>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 자유 입력 */}
        <form onSubmit={sendText} className="flex gap-2 border-t bg-white p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chat.inputPlaceholder')}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-yu focus:outline-none"
          />
          <button type="submit" className="shrink-0 rounded-lg bg-yu px-3 py-2 text-sm font-semibold text-white">
            {t('chat.send')}
          </button>
        </form>
      </aside>
    </>
  );
}

function QuickReply({ children, onClick, active = false, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded-full border-2 px-3.5 py-2 text-sm transition disabled:opacity-40 ${
        active
          ? 'border-yu-dark bg-yu-dark font-semibold text-white ring-2 ring-yu-dark/25'
          : 'border-slate-200 bg-white text-slate-700 hover:border-yu-dark'
      }`}
    >
      {children}
    </button>
  );
}
