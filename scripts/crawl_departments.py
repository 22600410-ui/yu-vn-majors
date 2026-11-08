#!/usr/bin/env python3
"""
영남대학교 대학/학과 정보 수집기 → public/data/departments.json

수집 대상
  1) 목록 페이지  https://www.yu.ac.kr/main/academics/university.do
     - div.b-uni-box            : 단과대학 (h4 = 이름, p = 소개, a.btn-home = 홈페이지)
     - div.b-dept-box           : 학과/학부 (p > span = 이름, a.btn-guide-detail = 공식 학과소개 링크)
     - div.b-dept-sub-box li    : 학부 내 전공
  2) 학과 상세 페이지 (/main/academics/<slug>.do)
     - p.sub-copy               : 한 줄 소개
     - p.txt02 span             : 해시태그(특징)
     - .border-con-box .con-p   : 학과 소개
     - h4 "전공안내"            : 전공 설명
     - h4 "전공교육분야"         : 교육 분야
     - ul.curriculum-box        : 학년별 교육과정
     - h5 "졸업 후 진로"         : 진로 (ul.career-box li > h6 + p)
     - h5 "취득가능 자격증"       : 자격증
     - h4 "특성화 프로그램"       : 특성화 프로그램

다국어 (언어 목록: config/languages.json)
  모든 텍스트 필드는 {"ko": "...", "vi": "...", "en": "...", ...} 형태로 저장됩니다(번역이 있는 언어만).
  크롤러는 원문(ko)만 채우며, 다른 언어는 아래 순서로 자동 보존/채움됩니다.
    a) 기존 departments.json에 이미 들어 있던 번역 (한국어 원문이 같으면 재사용)
    b) data/translations/<언어>.json 용어집 { "한국어 원문": "번역" }  ← 우선 적용
  --export-untranslated 로 켜진 언어(enabled)별 미번역 원문 목록을 뽑을 수 있습니다.
    폴더를 주면 <폴더>/<언어>.json, .json 파일을 주면 {언어: {원문: ""}} 한 파일로 저장.

사용 예
  pip install -r scripts/requirements.txt
  python scripts/crawl_departments.py                       # 전체 수집
  python scripts/crawl_departments.py --limit 3             # 상세 페이지 3개만 (테스트용)
  python scripts/crawl_departments.py --no-details          # 목록 페이지만
  python scripts/crawl_departments.py --cache-dir .cache    # HTML 캐시 (반복 개발 시 서버 부담 감소)
  python scripts/crawl_departments.py --export-untranslated data/untranslated.vi.json

예의 있는 수집
  - robots.txt를 확인하고 허용된 경로만 요청합니다.
  - 요청 사이 기본 1초 대기, 재시도 3회.
  - 수집 결과의 저작권은 영남대학교에 있습니다. 출처(공식 링크)를 사이트에 반드시 표기하세요.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib import robotparser
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup, Tag

BASE = "https://www.yu.ac.kr"
LIST_URL = f"{BASE}/main/academics/university.do"
USER_AGENT = "yu-vn-majors-crawler/0.1 (student project for Vietnamese applicants)"

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUT = ROOT / "public" / "data" / "departments.json"
TRANSLATIONS_DIR = ROOT / "data" / "translations"
ADMISSIONS_PATH = ROOT / "data" / "admissions.json"
LANG_CONFIG_PATH = ROOT / "config" / "languages.json"

SCHEMA_VERSION = 2

# config/languages.json 에서 main()이 다시 설정
SOURCE_LANG = "ko"
LANG_CODES: set[str] = {"ko", "vi", "en", "zh", "mn"}
ENABLED_LANGS: list[str] = ["ko", "vi"]


def load_lang_config(path: Path) -> None:
    global SOURCE_LANG, LANG_CODES, ENABLED_LANGS
    if not path.exists():
        return
    cfg = json.loads(path.read_text(encoding="utf-8"))
    SOURCE_LANG = cfg.get("source", "ko")
    LANG_CODES = {lang["code"] for lang in cfg["languages"]}
    ENABLED_LANGS = [lang["code"] for lang in cfg["languages"] if lang.get("enabled")]


# --------------------------------------------------------------------------- #
# 텍스트 유틸
# --------------------------------------------------------------------------- #
def clean(text: str | None) -> str:
    """공백/nbsp 정리. 줄바꿈은 하나로 유지."""
    if not text:
        return ""
    text = text.replace("\xa0", " ")
    lines = [re.sub(r"[ \t\r\f\v]+", " ", ln).strip() for ln in text.split("\n")]
    return "\n".join(ln for ln in lines if ln)


def text_of(el: Tag | None) -> str:
    return clean(el.get_text("\n")) if el else ""


def L(text: str) -> dict[str, str]:
    """LocalizedText 생성 (원문만). 번역은 apply_translation_memory 가 채움."""
    return {SOURCE_LANG: clean(text)}


def is_localized(obj: Any) -> bool:
    """{원문언어: ..., 다른언어: ...} 형태인지 (키가 모두 언어 코드이고 원문 키 포함)."""
    return isinstance(obj, dict) and SOURCE_LANG in obj and set(obj.keys()) <= LANG_CODES


def slug_from_url(url: str | None) -> str | None:
    if not url:
        return None
    p = urlparse(url)
    if p.netloc.endswith("yu.ac.kr") and p.netloc not in ("www.yu.ac.kr", "yu.ac.kr"):
        return p.netloc.split(".")[0]  # civil.yu.ac.kr → civil
    m = re.search(r"/([\w-]+)\.do$", p.path)
    return m.group(1) if m else None


def fallback_id(name: str) -> str:
    return "x-" + hashlib.sha1(name.encode("utf-8")).hexdigest()[:8]


# --------------------------------------------------------------------------- #
# HTTP
# --------------------------------------------------------------------------- #
class Fetcher:
    def __init__(self, delay: float, cache_dir: Path | None, respect_robots: bool = True):
        self.delay = delay
        self.cache_dir = cache_dir
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "ko-KR,ko;q=0.9"})
        self.robots: robotparser.RobotFileParser | None = None
        if respect_robots:
            rp = robotparser.RobotFileParser()
            rp.set_url(f"{BASE}/robots.txt")
            try:
                rp.read()
                self.robots = rp
            except Exception as e:  # robots.txt 를 못 읽으면 보수적으로 진행하지 않음
                raise SystemExit(f"robots.txt 확인 실패: {e}")
        if cache_dir:
            cache_dir.mkdir(parents=True, exist_ok=True)
        self._last = 0.0

    def _cache_path(self, url: str) -> Path | None:
        if not self.cache_dir:
            return None
        return self.cache_dir / (hashlib.sha1(url.encode()).hexdigest() + ".html")

    def get(self, url: str) -> str:
        cp = self._cache_path(url)
        if cp and cp.exists():
            return cp.read_text(encoding="utf-8")

        if self.robots and not self.robots.can_fetch(USER_AGENT, url):
            raise PermissionError(f"robots.txt 가 허용하지 않는 URL: {url}")

        last_err: Exception | None = None
        for attempt in range(3):
            wait = self.delay - (time.monotonic() - self._last)
            if wait > 0:
                time.sleep(wait)
            try:
                resp = self.session.get(url, timeout=20)
                self._last = time.monotonic()
                resp.raise_for_status()
                if not resp.encoding or resp.encoding.lower() == "iso-8859-1":
                    resp.encoding = "utf-8"
                html = resp.text
                if cp:
                    cp.write_text(html, encoding="utf-8")
                return html
            except requests.RequestException as e:
                last_err = e
                time.sleep(2 * (attempt + 1))
        raise RuntimeError(f"요청 실패 {url}: {last_err}")


# --------------------------------------------------------------------------- #
# 목록 페이지 파싱
# --------------------------------------------------------------------------- #
def _href(el: Tag | None) -> str | None:
    if not el or not el.get("href") or el["href"].startswith("#"):
        return None
    return urljoin(BASE, el["href"])


def _tel(scope: Tag | None) -> str | None:
    a = scope.select_one("a[href^='tel:']") if scope else None
    return a["href"][4:] if a else None


def parse_university_list(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    colleges: list[dict] = []
    seen_colleges: set[str] = set()

    for box in soup.select("div.b-uni-box"):
        title_box = box.select_one(".b-title-box")
        h4 = title_box.select_one(".txt-box h4") if title_box else None
        name = text_of(h4)
        if not name or name in seen_colleges:
            continue
        seen_colleges.add(name)

        homepage = _href(title_box.select_one("a.btn-home"))
        college = {
            "id": slug_from_url(homepage) or fallback_id(name),
            # "2027학년도 신설 및 변경 학부(과)·전공" 같은 안내용 묶음은 단과대학과 구분
            "type": "notice" if re.search(r"학년도|신설|변경", name) else "college",
            "name": L(name),
            "description": L(text_of(title_box.select_one(".txt-box p"))),
            "links": {"homepage": homepage},
            "phone": _tel(title_box.select_one(".btn-wrap")),
            "departments": [],
        }

        for dbox in box.select(".b-dept-wrap .b-dept-box"):
            main = dbox.select_one(".b-dept-main-box")
            if not main:
                continue
            dname = text_of(main.select_one("p > span")) or text_of(main.find("p"))
            if not dname:
                continue
            official = _href(main.select_one("a.btn-guide-detail"))
            dhome = _href(main.select_one("a.btn-home"))

            majors = []
            for li in dbox.select(".b-dept-sub-box > ul > li"):
                mname = text_of(li.find("p"))
                if not mname:
                    continue
                majors.append({
                    "name": L(mname),
                    "links": {
                        "official": _href(li.select_one("a.btn-guide-detail")),
                        "homepage": _href(li.select_one("a.btn-home")),
                    },
                })

            college["departments"].append({
                "id": slug_from_url(official) or slug_from_url(dhome) or fallback_id(dname),
                "collegeId": college["id"],
                "name": L(dname),
                "majors": majors,
                "links": {"official": official, "homepage": dhome},
                "phone": _tel(main),
                # 아래는 상세 페이지에서 채움
                "slogan": L(""),
                "tags": [],
                "description": L(""),
                "majorGuide": L(""),
                "fields": [],
                "curriculum": [],
                "careers": [],
                "certificates": [],
                "programs": [],
            })

        colleges.append(college)
    return colleges


# --------------------------------------------------------------------------- #
# 상세 페이지 파싱
# --------------------------------------------------------------------------- #
def _find_heading(root: Tag, tags: Iterable[str], keyword: str) -> Tag | None:
    for h in root.find_all(list(tags)):
        if keyword in text_of(h):
            return h
    return None


def _section(root: Tag, tags: Iterable[str], keyword: str) -> Tag | None:
    """제목(h4/h5)을 찾아 그 제목을 감싸는 블록을 반환."""
    h = _find_heading(root, tags, keyword)
    return h.parent if h else None


def _list_items(scope: Tag | None) -> list[str]:
    if not scope:
        return []
    items = [text_of(li) for li in scope.find_all("li")]
    return [i for i in items if i]


def parse_department_detail(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    root = soup.select_one("#cms-content") or soup

    out: dict[str, Any] = {}

    out["slogan"] = L(text_of(root.select_one(".sub-copy")))
    out["tags"] = [
        L(t.lstrip("#").strip())
        for t in (text_of(s) for s in root.select(".txt02 span"))
        if t.lstrip("#").strip()
    ]

    intro = root.select_one(".border-con-box .con-box .con-p")
    guide_sec = _section(root, ["h4"], "전공안내")
    guide = text_of(guide_sec.select_one(".con-p")) if guide_sec else ""
    intro_text = text_of(intro)
    out["description"] = L(intro_text or guide)
    out["majorGuide"] = L(guide if guide != intro_text else "")

    out["fields"] = [L(x) for x in _list_items(_section(root, ["h4"], "전공교육분야"))]

    curriculum = []
    for li in root.select(".curriculum-box > li"):
        year = text_of(li.find("span"))
        body = text_of(li.find("p"))
        if body:
            m = re.search(r"\d+", year)
            curriculum.append({"year": int(m.group()) if m else None, "label": L(year), "text": L(body)})
    out["curriculum"] = curriculum

    careers = []
    career_sec = _section(root, ["h5"], "졸업 후 진로") or _section(root, ["h5", "h4"], "진로")
    if career_sec:
        for li in career_sec.select(".career-box > li") or career_sec.find_all("li"):
            cat = text_of(li.find("h6"))
            detail = text_of(li.find("p")) or (text_of(li) if not cat else "")
            if detail or cat:
                careers.append({"category": L(cat), "detail": L(detail)})
    out["careers"] = careers

    out["certificates"] = [L(x) for x in _list_items(_section(root, ["h5", "h4"], "자격증"))]
    out["programs"] = [L(x) for x in _list_items(_section(root, ["h4"], "특성화 프로그램"))]
    return out


# --------------------------------------------------------------------------- #
# 외국인 유학생 모집 단위 (data/admissions.json)
# --------------------------------------------------------------------------- #
def _as_localized(v: Any) -> dict[str, str]:
    """사람이 쓴 {ko, vi, ...} 또는 문자열을 LocalizedText로 (빈 번역은 제외)."""
    if isinstance(v, dict):
        out = {SOURCE_LANG: clean(v.get(SOURCE_LANG, ""))}
        out.update({k: t for k, t in v.items() if k in LANG_CODES and k != SOURCE_LANG and t})
        return out
    return L(str(v or ""))


def apply_admissions(colleges: list[dict], adm: dict, keep_all: bool = False) -> tuple[list[dict], list[str]]:
    """모집 단위에 있는 학과에 admission 정보를 붙이고, 없는 학과는 제외(keep_all=False일 때)."""
    by_name: dict[tuple[str, str], dict] = {}
    for c in colleges:
        if c.get("type") != "college":
            continue
        for d in c["departments"]:
            by_name.setdefault((c["name"]["ko"], d["name"]["ko"]), d)

    unmatched: list[str] = []
    for track, table in adm.get("tracks", {}).items():
        years = table.get("_years")
        for college_name, entries in table.items():
            if college_name.startswith("_"):
                continue
            for e in entries:
                e = {"name": e} if isinstance(e, str) else e
                d = by_name.get((college_name, e["name"]))
                if not d:
                    unmatched.append(f"[{track}] {college_name} / {e['name']}")
                    continue
                if e.get("id"):  # 공식 링크가 없어 id가 x-해시로 생긴 학과에 읽기 쉬운 주소 부여
                    d["id"] = e["id"]
                info: dict[str, Any] = {"majors": [L(m) for m in e.get("majors", [])]}
                if years:
                    info["years"] = years
                if e.get("special"):
                    info["special"] = True
                if e.get("note"):
                    info["note"] = _as_localized(e["note"])
                d.setdefault("admission", {})[track] = info

    if not keep_all:
        for c in colleges:
            c["departments"] = [d for d in c["departments"] if d.get("admission")]
        colleges = [c for c in colleges if c["departments"]]
    return colleges, unmatched


def ensure_unique_ids(colleges: list[dict]) -> None:
    """학과 id가 겹치면(-2, -3 …) 붙여서 상세 페이지 주소가 충돌하지 않게 함."""
    seen: set[str] = set()
    for c in colleges:
        for d in c["departments"]:
            base, i = d["id"], 2
            while d["id"] in seen:
                d["id"] = f"{base}-{i}"
                i += 1
            seen.add(d["id"])


def write_step_summary(lines: list[str]) -> None:
    """GitHub Actions 실행 화면의 Summary에 표시 (로컬 실행 시엔 무시)."""
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if path:
        with open(path, "a", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n\n")


# --------------------------------------------------------------------------- #
# 번역 보존(Translation Memory)
# --------------------------------------------------------------------------- #
def walk_localized(obj: Any):
    if is_localized(obj):
        yield obj
    elif isinstance(obj, dict):
        for v in obj.values():
            yield from walk_localized(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk_localized(v)


TranslationMemory = dict[str, dict[str, str]]  # {언어: {원문: 번역}}


def build_translation_memory(prev_path: Path, translations_dir: Path) -> TranslationMemory:
    targets = sorted(LANG_CODES - {SOURCE_LANG})
    tm: TranslationMemory = {lang: {} for lang in targets}
    if prev_path.exists():
        try:
            prev = json.loads(prev_path.read_text(encoding="utf-8"))
            for loc in walk_localized(prev):
                src = loc.get(SOURCE_LANG)
                for lang in targets:
                    if src and loc.get(lang):
                        tm[lang][src] = loc[lang]
        except json.JSONDecodeError:
            print(f"[warn] 기존 파일 파싱 실패, 번역 보존 생략: {prev_path}", file=sys.stderr)
    for lang in targets:
        glossary_path = translations_dir / f"{lang}.json"
        if glossary_path.exists():
            glossary = json.loads(glossary_path.read_text(encoding="utf-8"))
            tm[lang].update({k: v for k, v in glossary.items() if not k.startswith("_") and v})
    return tm


def apply_translation_memory(data: Any, tm: TranslationMemory) -> dict[str, set[str]]:
    """번역을 채우고, 켜진 언어별 미번역 원문 집합을 반환. 빈 번역 키는 제거."""
    enabled_targets = [lang for lang in ENABLED_LANGS if lang != SOURCE_LANG]
    missing: dict[str, set[str]] = {lang: set() for lang in enabled_targets}
    for loc in walk_localized(data):
        for k in [k for k, v in loc.items() if k != SOURCE_LANG and not v]:
            del loc[k]
        src = loc.get(SOURCE_LANG)
        if not src:
            continue
        for lang, mem in tm.items():
            if not loc.get(lang) and src in mem:
                loc[lang] = mem[src]
        for lang in enabled_targets:
            if not loc.get(lang):
                missing[lang].add(src)
    return missing


# --------------------------------------------------------------------------- #
# main
# --------------------------------------------------------------------------- #
def main() -> int:
    ap = argparse.ArgumentParser(description="영남대 학과 정보 → departments.json")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--translations-dir", type=Path, default=TRANSLATIONS_DIR,
                    help="언어별 번역 용어집 폴더 (<언어>.json)")
    ap.add_argument("--languages", type=Path, default=LANG_CONFIG_PATH, help="언어 설정 파일")
    ap.add_argument("--admissions", type=Path, default=ADMISSIONS_PATH,
                    help="외국인 유학생 모집 단위 파일 (없으면 전체 학과 수집)")
    ap.add_argument("--all-departments", action="store_true",
                    help="모집 단위에 없는 학과도 결과에 남김")
    ap.add_argument("--delay", type=float, default=1.0, help="요청 간 대기(초)")
    ap.add_argument("--limit", type=int, default=0, help="상세 페이지 수집 개수 제한(0=전체)")
    ap.add_argument("--no-details", action="store_true", help="상세 페이지를 수집하지 않음")
    ap.add_argument("--cache-dir", type=Path, default=None, help="HTML 캐시 디렉터리")
    ap.add_argument("--export-untranslated", type=Path, default=None,
                    help="미번역 원문 목록 저장 (폴더 → <언어>.json / .json 파일 → 언어별로 묶은 한 파일)")
    args = ap.parse_args()
    load_lang_config(args.languages)

    fetcher = Fetcher(delay=args.delay, cache_dir=args.cache_dir)

    print(f"[1/3] 목록 수집: {LIST_URL}")
    colleges = parse_university_list(fetcher.get(LIST_URL))
    total_depts = sum(len(c["departments"]) for c in colleges)
    print(f"      단과대학 {len(colleges)}개, 학과/학부 {total_depts}개")

    admission_meta = None
    if args.admissions.exists():
        adm = json.loads(args.admissions.read_text(encoding="utf-8"))
        colleges, unmatched = apply_admissions(colleges, adm, keep_all=args.all_departments)
        admission_meta = {
            "year": _as_localized(adm.get("year", "")),
            "notes": [_as_localized(n) for n in adm.get("notes", [])],
            "tracks": [t for t in adm.get("tracks", {})],
            "unmatched": unmatched,
        }
        kept = sum(len(c["departments"]) for c in colleges)
        print(f"      유학생 모집 단위 적용: {kept}개 학과 (매칭 실패 {len(unmatched)}건)")
        for u in unmatched:
            print(f"      [warn] 매칭 실패 {u}", file=sys.stderr)
        write_step_summary(
            ["### 유학생 모집 단위 매칭",
             f"- 사이트에 표시할 학과 {kept}개 (전체 {total_depts}개 중)",
             f"- 매칭 실패 {len(unmatched)}건" + ("" if not unmatched else " — data/admissions.json 의 이름을 확인하세요")]
            + [f"  - {u}" for u in unmatched]
        )
    ensure_unique_ids(colleges)
    depts = [d for c in colleges for d in c["departments"]]

    if not args.no_details:
        targets = [d for d in depts if d["links"]["official"]]
        if args.limit:
            targets = targets[: args.limit]
        print(f"[2/3] 상세 페이지 {len(targets)}개 수집")
        for i, d in enumerate(targets, 1):
            url = d["links"]["official"]
            try:
                d.update(parse_department_detail(fetcher.get(url)))
                print(f"      ({i}/{len(targets)}) {d['name']['ko']} ✓")
            except Exception as e:  # 페이지 구조가 다른 학과도 전체 수집은 계속
                d["crawlError"] = str(e)
                print(f"      ({i}/{len(targets)}) {d['name']['ko']} ✗ {e}", file=sys.stderr)
    else:
        print("[2/3] 상세 페이지 생략 (--no-details)")

    # 상세 설명이 없으면 단과대학 소개로 대체하지 않고 비워 둡니다(UI에서 대학 소개를 보여줌).
    data = {
        "meta": {
            "schemaVersion": SCHEMA_VERSION,
            "source": LIST_URL,
            "crawledAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "sourceLanguage": SOURCE_LANG,
            "languages": ENABLED_LANGS,
            "collegeCount": len(colleges),
            "departmentCount": len(depts),
            "totalDepartmentCount": total_depts,
            "admission": admission_meta,
            "copyright": "Nội dung gốc © Yeungnam University / 원문 저작권: 영남대학교",
        },
        "colleges": colleges,
    }

    print("[3/3] 번역 적용 및 저장")
    tm = build_translation_memory(args.out, args.translations_dir)
    missing = apply_translation_memory(data, tm)
    data["meta"]["untranslated"] = {lang: len(s) for lang, s in missing.items()}
    data["meta"]["untranslatedCount"] = sum(len(s) for s in missing.values())

    # 내용이 그대로면 crawledAt도 이전 값을 유지 → 불필요한 커밋/재배포 방지
    if args.out.exists():
        try:
            prev = json.loads(args.out.read_text(encoding="utf-8"))
            strip = lambda d: {**d, "meta": {k: v for k, v in d.get("meta", {}).items() if k != "crawledAt"}}
            if strip(prev) == strip(data):
                data["meta"]["crawledAt"] = prev["meta"]["crawledAt"]
        except (json.JSONDecodeError, KeyError):
            pass

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    per_lang = ", ".join(f"{lang} {len(s)}" for lang, s in missing.items()) or "없음"
    print(f"      저장: {args.out}  (미번역 문장: {per_lang})")
    write_step_summary(["### 언어별 미번역 문장"] + [f"- {lang}: {len(s)}개" for lang, s in missing.items()])

    if args.export_untranslated:
        target = args.export_untranslated
        as_template = lambda s: {k: "" for k in sorted(s)}
        if target.suffix == ".json":
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(json.dumps({lang: as_template(s) for lang, s in missing.items()},
                                         ensure_ascii=False, indent=2), encoding="utf-8")
        else:
            target.mkdir(parents=True, exist_ok=True)
            for lang, s in missing.items():
                (target / f"{lang}.json").write_text(json.dumps(as_template(s), ensure_ascii=False, indent=2),
                                                     encoding="utf-8")
        print(f"      미번역 목록: {target}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
