/** 밑줄형 탭 (선택된 탭만 굵게 + 아래 밑줄). 모바일에서는 가로 스크롤 */
export default function UnderlineTabs({ items, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="-mx-4 flex gap-5 overflow-x-auto px-4 sm:gap-6">
      {items.map((it) => {
        const active = value === it.id;
        return (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.id)}
            className={`relative shrink-0 whitespace-nowrap pb-2.5 pt-1 text-[15px] transition ${
              active
                ? 'font-extrabold text-yu-dark after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded after:bg-yu-dark'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {it.label}
            {it.count != null && <span className="ml-1 text-xs font-normal text-slate-400">{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
