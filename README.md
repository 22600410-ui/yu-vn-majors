# yu-vn-majors — 영남대학교 학과 추천·소개 (Tiếng Việt / 한국어)

베트남 유학생을 위한 영남대학교 학과 소개 정적 사이트입니다. React + Vite + Tailwind CSS, GitHub Pages 배포.

## 디렉터리 구조

```
yu-vn-majors/
├─ .github/workflows/deploy.yml   # main push → 빌드 → GitHub Pages 배포
├─ scripts/
│  ├─ crawl_departments.py        # 영남대 학과 수집기 → public/data/departments.json
│  └─ requirements.txt
├─ data/
│  └─ translations/vi.json        # 한국어 원문 → 베트남어 번역 용어집 (사람이 관리)
├─ public/
│  └─ data/departments.json       # 크롤러 결과물 (앱이 fetch). 현재는 샘플 데이터
├─ src/
│  ├─ i18n/index.js               # i18next 설정 (기본 vi, fallback vi→ko)
│  ├─ locales/{vi,ko}/common.json # UI 문구
│  ├─ utils/localize.js           # LocalizedText 해석·대체·검색 정규화
│  ├─ hooks/useDepartments.js
│  ├─ components/                 # LanguageSwitcher, LocalizedText, DepartmentCard
│  ├─ pages/                      # Home(목록·검색), DepartmentDetail
│  ├─ App.jsx  main.jsx  index.css
├─ index.html  package.json  vite.config.js  tailwind.config.js  postcss.config.js
```

## 시작하기

```bash
npm install
pip install -r scripts/requirements.txt
npm run crawl          # 실제 데이터 수집 (약 1~2분, 요청 간 1초 대기)
npm run dev
```

크롤러 옵션: `--limit 3`(상세 3개만), `--no-details`(목록만), `--cache-dir .cache`(HTML 캐시), `--delay 1.5`.

## 다국어(i18n) 설계 — 2개 층

| 층 | 위치 | 형식 | 관리 |
|---|---|---|---|
| UI 문구 | `src/locales/{vi,ko}/common.json` | i18next 네임스페이스 키 | 개발자 |
| 학과 콘텐츠 | `public/data/departments.json` | 모든 텍스트 = `{ "ko": "...", "vi": "..." }` | 크롤러(ko) + 번역(vi) |

**LocalizedText 규칙**: 텍스트 필드는 전부 `{ko, vi}` 객체입니다(목록은 객체 배열). 언어를 하나 더 추가하려면 키만 추가하면 됩니다.

**fallback**: `vi`가 비어 있으면 `ko` 원문을 표시하고 "Bản gốc tiếng Hàn" 배지를 붙입니다(`LocalizedText` 컴포넌트).

**재수집해도 번역이 지워지지 않음**: 크롤러는 ko만 새로 채운 뒤,
1. 기존 `departments.json`의 vi 번역을 **한국어 원문이 같으면** 그대로 재사용하고,
2. `data/translations/vi.json` 용어집을 우선 적용합니다.

**번역 작업 흐름**
```bash
npm run crawl:untranslated     # data/untranslated.vi.json 에 미번역 원문 목록 생성
# → 값을 베트남어로 채워 data/translations/vi.json 에 병합
npm run crawl                  # 번역 반영된 departments.json 재생성
```

언어 선택: `?lang=ko` 쿼리 → localStorage → 브라우저 언어 순으로 감지, 기본값 `vi`.

## departments.json 스키마 (요약)

```jsonc
{
  "meta": { "schemaVersion": 1, "source": "...", "crawledAt": "ISO8601", "untranslatedCount": 0, ... },
  "colleges": [{
    "id": "eng", "type": "college | notice",
    "name": {"ko","vi"}, "description": {"ko","vi"},
    "links": { "homepage": "..." }, "phone": "053-...",
    "departments": [{
      "id": "me", "collegeId": "eng",
      "name": {"ko","vi"}, "slogan": {"ko","vi"}, "tags": [{"ko","vi"}],
      "description": {"ko","vi"}, "majorGuide": {"ko","vi"},
      "fields": [{"ko","vi"}],
      "curriculum": [{ "year": 1, "label": {"ko","vi"}, "text": {"ko","vi"} }],
      "careers":    [{ "category": {"ko","vi"}, "detail": {"ko","vi"} }],
      "certificates": [{"ko","vi"}], "programs": [{"ko","vi"}],
      "majors": [{ "name": {"ko","vi"}, "links": { "official", "homepage" } }],
      "links": { "official": "https://www.yu.ac.kr/main/academics/me.do", "homepage": "..." },
      "phone": "...", "crawlError": "(실패 시에만)"
    }]
  }]
}
```

## 설치 없이 GitHub에서 수집·배포하기 (Python/Node 불필요)

| 워크플로 | 하는 일 | 실행 시점 |
|---|---|---|
| `.github/workflows/crawl.yml` | 크롤러 실행 → `departments.json` 커밋 → 바뀐 게 있으면 배포 호출 | 수동 실행 / 매주 월 03:00(KST) |
| `.github/workflows/deploy.yml` | React 빌드 → GitHub Pages 배포 | main에 push / crawl.yml이 호출 |

### 처음 한 번 설정
1. GitHub에서 새 저장소 `yu-vn-majors`를 만듭니다(Public). 이름을 다르게 하면 `vite.config.js`의 `base`를 `'/<저장소이름>/'`으로 바꿉니다.
2. 저장소 첫 화면의 **uploading an existing file** → `yu-vn-majors` 폴더 **안의 내용 전부**(`.github` 폴더 포함)를 끌어다 놓고 **Commit changes**.
   - `.github` 폴더가 빠지면 Actions가 생기지 않습니다. 업로드 후 저장소에 `.github/workflows/`가 보이는지 확인하세요.
3. **Settings → Pages → Build and deployment → Source: GitHub Actions** 로 바꿉니다.
4. **Settings → Actions → General → Workflow permissions** 가 막혀 있다면 *Read and write permissions* 로 바꿉니다(데이터 커밋용).

### 수집 실행
1. **Actions** 탭 → 왼쪽 **Crawl YU departments** → **Run workflow**.
2. 처음엔 `limit`에 `3`을 넣어 테스트해 보세요. 테스트 실행은 커밋하지 않고, 실행 결과 화면 하단 **Artifacts → untranslated-vi** 에서 결과 JSON을 내려받아 확인할 수 있습니다.
3. 괜찮으면 `limit = 0`으로 다시 실행 → 데이터 커밋 → 사이트 자동 배포.
4. 사이트 주소: `https://<GitHub아이디>.github.io/yu-vn-majors/`

실행 결과 화면의 **Summary**에 단과대학/학과 수, 미번역 문장 수, 상세 페이지 실패 학과가 표시됩니다.

### 번역 반영 (설치 없이)
1. 수집 실행 결과의 **Artifacts → untranslated-vi** 를 내려받아 `untranslated.vi.json` 의 빈 값을 베트남어로 채웁니다.
2. GitHub 웹에서 `data/translations/vi.json` 을 열어 ✏️(편집) → 번역한 항목을 붙여 넣고 커밋합니다.
3. **Run workflow** 를 다시 실행하면 번역이 `departments.json`에 반영되어 배포됩니다.

내용이 바뀌지 않은 주에는 `crawledAt`도 그대로 유지되어 커밋·배포가 생략됩니다.
라우팅은 HashRouter(`/#/department/me`)라 GitHub Pages에서 별도 404 처리가 필요 없습니다.

## 데이터 수집 시 주의

- 크롤러는 robots.txt를 확인하며 `/main/academics/*` 페이지만 요청합니다(`/_res/` 이미지 등은 robots.txt상 금지라 수집하지 않음).
- 원문 저작권은 영남대학교에 있습니다. 사이트에 출처와 공식 링크를 항상 표시하세요.
