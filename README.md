# yu-vn-majors — Yeungnam University Department Finder

영남대학교에 지원하려는 외국인 유학생(우선 베트남)을 위한 학과 소개·추천 정적 사이트입니다.
React + Vite + Tailwind CSS로 만들었고, GitHub Actions로 수집과 배포를 합니다. PC에 설치할 프로그램은 없습니다.

- 사이트: https://22600410-ui.github.io/yu-vn-majors/
- 언어: 한국어(원문)와 베트남어를 켜 두었습니다. 영어·중국어·몽골어는 설정만 해 두고 꺼 둔 상태입니다.

## 디렉터리 구조

```
yu-vn-majors/
├─ .github/workflows/
│  ├─ crawl.yml                   # 수집 → departments.json 커밋 → 배포 호출 (수동 / 매주 월 03:00 KST)
│  └─ deploy.yml                  # React 빌드 → GitHub Pages
├─ config/languages.json          # ★ 언어 설정 (크롤러·화면 공용)
├─ data/
│  ├─ admissions.json             # ★ 외국인 유학생 모집 단위 (신입학/편입학)
│  └─ translations/<언어>.json     # 언어별 번역 용어집 {원문: 번역}
├─ scripts/crawl_departments.py   # 영남대 학과 수집기
├─ public/data/departments.json   # 수집 결과 (사이트가 읽는 데이터, 직접 수정 X)
└─ src/
   ├─ data/
   │  ├─ fields.json              # ★ 메인 화면 계열 탭 (인문/사회/자연/공학/예체능)
   │  ├─ recommend.json           # ★ 학과 추천 규칙 (관심 분야·희망 진로 → 학과)
   │  └─ images.json              # 학과 대표 사진 목록 (선택)
   ├─ locales/<언어>/common.json   # 화면 문구
   ├─ i18n/                       # 언어 설정 연결
   ├─ utils/                      # localize(번역 대체), recommend(추천 계산), fields(계열·썸네일)
   ├─ components/                 # MajorCard, RecommenderChat, LanguageSwitcher …
   └─ pages/                      # Home, Departments, DepartmentDetail, Recommend
```

★ 표시는 사람이 직접 관리하는 파일입니다.

## 화면 구성

| 주소 | 화면 | 내용 |
|---|---|---|
| `#/` | 메인 | 소개 영역, **계열 탭과 학과 카드**(데스크톱 4열 / 모바일 2열), 지원 전 확인 사항 |
| `#/departments` | 학과 찾기 | 검색 + 입학 유형·단과대학 필터 (주소에 필터가 저장되어 공유 가능) |
| `#/department/<id>` | 학과 상세 | 지원 정보 → 소개 → 교육과정 → 진로 → 자격증 → 공식 링크 → 같은 단과대학 학과 |
| `#/recommend` | 학과 추천 | 질문 3개(입학 유형, 관심 분야, 희망 진로) → 추천 학과와 추천 이유 |
| 모든 화면 | AI 전공 추천 챗봇 | 오른쪽 아래 버튼을 누르면 열립니다. 데스크톱은 오른쪽 패널, 모바일은 하단 팝업입니다 |

### 학과 카드 썸네일
영남대 홈페이지의 이미지는 robots.txt에서 수집을 금지(`/_res/`)하고 있어 가져오지 않습니다.
그래서 계열 색·아이콘·학과 이름으로 썸네일을 자동으로 만듭니다.
직접 찍었거나 사용 허락을 받은 사진은 `public/images/departments/`에 넣고 `src/data/images.json`에 `"학과id": "파일명"` 형식으로 적으면 그 사진이 대신 나옵니다.

### 자주 묻는 질문 (FAQ)
- `src/data/faq.json`에서 질문과 답변(ko·vi), 분류(지원·입학 / 학과 선택 / 졸업 후 진로), 관련 학과, 챗봇 연결용 키워드를 관리합니다.
- `careerDepartments`에 적은 학과는 수집한 진로 데이터로 "○○ 졸업 후에는 어떤 일을 하나요?" 질문을 자동으로 만듭니다.
- 메인 화면 아래 6개, `#/faq`에 전체 목록이 나옵니다. 카드를 누르면 답변 팝업이 열리고, "AI에게 더 물어보기"를 누르면 챗봇으로 넘어갑니다.

### 전공 추천 챗봇
AI(외부 API)를 쓰지 않는 **규칙 기반** 챗봇입니다. 비용이 들지 않고 서버도 필요 없습니다.
- 질문 3개에 답하면 `recommend.json` 규칙으로 학과를 고릅니다.
- 직접 입력한 질문은 다음 순서로 답합니다: FAQ 질문과 똑같은 문장 → 학과 이름·핵심 키워드가 분명히 맞는 학과 → FAQ 키워드 → 비슷한 학과.

### 학과 핵심 키워드와 검색
- `src/data/keywords.json`: 학과마다 화면에 보이는 해시태그 2개(예: `#중국어 #중국문화`)와, 화면에는 안 보이는 검색용 비슷한 말(예: 컴퓨터학부 → 코딩, 프로그래밍, AI, lập trình)을 관리합니다.
- 검색(`src/utils/search.js`) 결과는 두 묶음으로 나옵니다.
  - **가장 정확한 학과:** 학과 이름, 해시태그, 비슷한 말, 세부 전공 순으로 점수를 매겨 고릅니다.
  - **비슷한 학과:** 같은 관심 분야 묶음(`recommend.json`)이나 같은 계열에 있는 학과, 소개 글에 검색어가 나오는 학과입니다.
- "학과", "전공"처럼 모든 학과에 걸리는 말은 검색어에서 자동으로 뺍니다.

### 학과 카드 미리보기
데스크톱에서 학과 카드에 마우스를 0.25초 올려 두면 카드 두 칸 크기의 요약 카드가 펼쳐집니다. 요약 카드에는 한 줄 소개, 소개 앞 2문장, 졸업 후 진로 3개, 지원 유형이 나옵니다. 휴대폰처럼 마우스가 없는 기기에서는 카드를 누르면 바로 상세 페이지로 갑니다.

### 로고와 학과 사진
- **로고:** 사용 허락을 확인한 영남대학교 로고 파일을 `public/images/`에 넣고 `src/data/site.json`의 `logo`에 파일 이름을 적습니다. 비워 두면 "YU" 배지가 나옵니다.
- **학과 사진:** `public/images/departments/`에 넣고 `src/data/images.json`에 `"학과id": "파일명"` 형식으로 적습니다. 카드 썸네일과 미리보기 배경에 쓰입니다.
- 영남대 홈페이지의 로고·사진은 `/_res/` 폴더에 있는데, robots.txt가 이 폴더의 자동 수집을 막고 있고 저작권도 학교에 있습니다. 그래서 자동 수집하지 않습니다.

## 다국어 구조

| 층 | 위치 | 관리 |
|---|---|---|
| 언어 목록 | `config/languages.json` | 켜기/끄기, 처음 접속 시 언어(`default`), 대체 순서(`fallback`) |
| 화면 문구 | `src/locales/<언어>/common.json` | 폴더를 추가하면 자동으로 등록 |
| 학과 내용 | `public/data/departments.json` | 텍스트는 모두 `{ "ko": 원문, "vi": …, "en": … }` 형식이고, 번역이 있는 언어만 들어감 |
| 번역 용어집 | `data/translations/<언어>.json` | `{ "한국어 원문": "번역" }`. 수집할 때 자동으로 반영 |

- **번역이 없을 때:** `fallback` 순서대로 다른 언어를 보여 줍니다(예: vi → en → ko). 이때 "○○로 표시" 배지가 붙습니다.
- **번역 보존:** 다시 수집해도 한국어 원문이 같은 문장은 이전 번역을 그대로 씁니다.
- **새 언어 추가 방법(예: 영어)**
  1. `config/languages.json`에서 `en`의 `enabled`를 `true`로 바꿉니다.
  2. `src/locales/en/common.json`을 만듭니다. `ko` 파일을 복사해서 번역하면 됩니다.
  3. 화면 문구용 데이터의 영어 이름(`label.en`)을 추가합니다: `src/data/recommend.json`, `src/data/fields.json`.
  4. 수집을 다시 실행하면 학과 내용의 영어 미번역 목록이 만들어집니다. 자동 번역 기능은 이후 단계에서 추가할 예정입니다.
- **공개할 때:** 지금은 한국어로 틀을 다듬는 단계라 `default`가 `"ko"`입니다. 베트남 학생에게 공개할 때 `"vi"`로 바꾸세요. `?lang=vi`를 붙이면 언어를 지정해서 열 수 있습니다.

## 수집·배포 (설치 불필요)
1. **Actions → Crawl YU departments → Run workflow**를 누릅니다. `limit`을 0으로 두면 전체 수집입니다.
2. 실행이 끝나면 Summary에 모집 단위 매칭 결과, 학과 수, 언어별 미번역 문장 수가 나옵니다.
3. 데이터가 바뀌었으면 자동으로 커밋·배포됩니다. 이 밖에 `main`에 직접 push해도 배포됩니다.

처음 설정할 때는 Settings → Pages에서 Source를 **GitHub Actions**로, Settings → Actions → General에서 Workflow permissions를 **Read and write**로 바꿔 둡니다.

## 데이터 수집 시 주의
- 크롤러는 robots.txt를 확인하고 `/main/academics/*` 페이지만 요청합니다. 요청 사이에 1초씩 기다립니다.
- 원문 저작권은 영남대학교에 있습니다. 사이트 하단에 출처와 "공식 사이트가 아님" 안내를 표시합니다.
