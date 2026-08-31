# 🚿 위생배관 관경 산정 시스템 — MANMIN **Ver 5.0**

> **Developer MANMIN** | ㈜대성건축사사무소
> **기계설비 기술기준** 국토교통부 고시 제2021-851호(제2026-360호로 일부개정, 2026. 7. 8. 시행) [별표 4·5·6·8]
> 급수·급탕·환탕·오배수·통기 관경 자동 산정 + FU 기구부하단위법(Hunter 곡선) PWA

[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-배포됨-blue)](https://manminkim-eng.github.io/Sanitary-Piping-System)
[![PWA](https://img.shields.io/badge/PWA-지원-green)](https://web.dev/progressive-web-apps/)
[![기준](https://img.shields.io/badge/기준-기계설비_기술기준-navy)](https://www.law.go.kr)

---

## 🆕 Ver 5.0 — MANMIN WAP 디자인 통일 (2026-08-31)

MANMIN WAP 39종 디자인 통일 작업의 **기계설비 계열 두 번째 적용본**이다.
기준본은 20 건물우수(`Roof-Drain`) Ver 5.0이며, 마스터는 01 옥내소화전(`fire-hydrant-calc`) Ver 5.0이다.
여기서 확정한 패턴은 22 냉온수배관 · 24 설비펌프 · 25 급탕설비 · 26 환기설비로 복제된다.

> **계산 로직은 1바이트도 변경하지 않았다.**
> FU 환산·관경 조회표·Hazen-Williams 마찰손실·잔류압 판정 모두 Ver 2.0과 동일하다.
> 계산 구간 diff **1행**(삭제된 `renderMobile()` 호출뿐), 숫자 토큰 다중집합 **326개 완전 일치**,
> 원본 대 v5.0 계산함수 실행 대조 **48,120건 불일치 0건**을 검증했다.

### 조정 내역

| # | 항목 | 기존 (Ver 2.0) | 변경 (Ver 5.0) |
|---|------|---------------|---------------|
| ① | **본문 폰트** | `Pretendard` — jsDelivr CDN 의존 | **`Noto Sans KR`** + 로컬 woff2 동봉 → 오프라인·차단망에서도 한글 유지 |
| ② | **전역 셀렉터** | `*{font-family:…!important}` — 모든 요소 강제 | **태그 목록**으로 축소 (마스터와 동일) |
| ③ | **계산서 폰트 강제** | `.a4-page *{Pretendard !important}` 가 `.mono` 를 덮어 **A4 안 숫자가 비고정폭** | 해제 → **JetBrains Mono 가 계산서에서 실제 적용**, `tabular-nums` 병행 |
| ④ | **A4 여백** | `@page margin:20mm 20mm 20mm 20mm` (ISO 기본값) | **`14mm 12mm 22mm 14mm`** — 39종 공통, 유효영역 **184 × 261mm** |
| ⑤ | **인쇄 폭** | `@page` + `.a4-page` 자체 padding 이중 적용 | 여백을 `@page` 하나로 **일원화** |
| ⑥ | **하단 각인** | 없음 (마지막 장 footer 만) | `#dev-stamp` 를 `position:fixed` 로 → **매 페이지 출력** |
| ⑦ | **JPG 저장** | `exportMobileJPG()` — S24 목업(`#mob-device`)을 다크배경 캡처 | **20 건물우수의 `MANMIN 모바일 JPG 저장 v5.4` 원문 이식** — 인쇄와 **동일 DOM**(`#a4Page`) 캡처 · 쪽나눔 인식 · 블록 실측 분할(최대 3단계) · 넘침 시 표 행 단위 분할 · `document.fonts.ready` 대기 |
| ⑦-1 | **JPG 미리보기** | 없음 (즉시 다운로드) | **2매 이상이면 저장 시트 모달**(`#mm-save-ov`) — 페이지별 썸네일 + 개별 저장 버튼. 브라우저가 연속 다운로드를 차단하므로 사용자가 눌러야 전부 받아진다. 1매면 바로 저장 |
| ⑧ | **모바일 미리보기 탭** | 별도 탭 + 이중 출력 경로 (`renderMobile` 106줄) | **삭제** — 출력 경로를 하나로 통일 |
| ⑨ | **출력 버튼** | 헤더 `🖨️ 출력` + A4 탭 `🖨️ 인쇄` + 모바일 탭 `📷 JPG`·`📤 공유` = **4곳** | `.mm-btn` 규격 v5.1 — **A4 탭 한 곳으로 일원화** |
| ⑩ | **헤더 구조** | 2단 (`div.brand-title` 13px + 부제 9px) · `height:58px` 고정 · `<h1>` 없음 · 심볼 로고(`brand-icon.jpg`) 있음 | **소방 마스터 규격 그대로 이식** — `.hdr-eyebrow` 11 · `h1.hdr-h1` 26 · `.hdr-sub` 11 + `.hdr-manmin` 각인, 우측 `.hdr-right` 근거 블록. **심볼 로고 삭제** |
| ⑩-1 | **헤더 높이 162.2px** | — | `min-height` 로 강제하지 않는다. **구성요소 합**으로 나온다 — 상단패딩 20 + 본문 78.2 + 간격 16 + 탭패딩 4 + 탭 44 = **162.2**. 그래서 `.tab-bar{margin-top:16px}` 와 `.tb{padding:11px 16px;font-size:13px}` 가 헤더 높이 규격의 일부다 |
| ⑩-2 | **헤더 각인 문구** | — | `MANMIN · Ver-5.0` **단독** — 상호·성명(㈜대성건축사사무소 건축사 김만민)은 표기하지 않는다. 계산서 "작성자" 필드가 그 역할을 한다 |
| ⑩-3 | **헤더 출력 버튼** | `🖨️ 출력` 있음 | **삭제** — 인쇄는 A4 탭 `.mm-btn` 으로 일원화 (20번과 동일) |
| ⑩-4 | **헤더 색상** | 연청록 `#cffafe` 배경 + 진한 청록 텍스트 | **단일색 `#0e7490` + 흰 텍스트** — 소방 마스터의 진한 배경 구성을 따르되 그라데이션 없이 기계설비 주도색 단색. 탭바 `#0b5f77` 동계열 · 각인 `#7dd3fc` |
| ⑪ | **A4 계산서 제목부** | `🚿 위생배관 관경 산정서` · `.a4-tit` 17px · 공사명은 개요표 안에만 | **20 건물우수 출력 규격 이식** — 타이틀 **심볼 삭제** · `위생배관 관경 산정 결과서` · 22px / `2.5px solid` / pb 9 / mb 12. 제목 아래 **좌(공사명 12px) · 우(근거·작성일·작성자 9px) 2단** |
| ⑪-1 | **A4 본문 규격** | `.a4-page` padding `76 90 76 90` · 11px 아님(10.5) · `min-height` 없음 | **padding `15px 23px 28px` · font 11px · `min-height:1122px`** — 여백은 `@page` 가 담당하므로 자체 패딩은 얇게. 내용 폭 **614 → 748px (+21.8%)** |
| ⑪-2 | **A4 표·소제목** | `.a4-sub` 10.5px · `.a4-tbl` 9.5px · th `3px 5px` · td `3px 6px` | **`.a4-sub` 13px · `.a4-tbl` 11px · th `5px 6px` · td `5px 7px`** · `tfoot` 강조행 추가 |
| ⑪-3 | **A4 푸터** | 8px `#94a3b8` · flex 2분할 | **9px `#9ca3af` · 3분할** — 인쇄에서는 flex 가 어긋나므로 `display:table-cell` 33.33% 로 고정 |
| ⑪-4 | **쪽나눔 제어** | 없음 | `.a4-section{break-inside:avoid}` · `.a4-section.allow-break` · `.a4-tbl.long` (20번 규격) |
| ⑫ | **A4 미리보기 스케일** | `transform-origin:top center` + `clientWidth-48` 하드코딩 차감 | 전 구간 **`top left` + `translateX(offset)`** + `getBoundingClientRect().width` — 마스터 검증식 |
| ⑬ | **FAB** | 드래그 이동형 원형 단일 + 툴팁 (IIFE 36줄) | **고정 세로스택** `.fab-wrap` — 아이콘 20 / 라벨 10 / 부제 9, 출력·기준 2버튼 |
| ⑭ | **브레이크포인트** | **14종** (360·380·430·460·479·480·520·600·760·767·768·860·1099·1100) | **규격 6종** — 1024 · 860 · 768 · 640 · 480 · 420 |
| ⑮ | **표 스크롤** | `.twrap` 만, 힌트 없음 · `min-width` 없어 셀이 찌그러짐 | `.tbl-hint` **10곳 추가** (≤768px) · `.rtbl{min-width:560px}` |
| ⑯ | **버전 체계** | Ver2.0 / `sanpipe-v3.0.0` | **Ver-5.0 / `manmin-v5.0.0`** (전 39종 5.0에서 재출발) |
| ⑰ | **디바이스 분기** | `start.html` → `pages/mobile.html`·`tablet.html` (`css/`+`js/` 별도 로드) | **단일 `index.html` 로 통합** — 아래 별항 참조 |
| ⑱ | **고시번호** | `제2021-851호` 단독 | **`제2021-851호(제2026-360호로 일부개정, 2026. 7. 8. 시행)`** 병기 — 8지점 |

### ⚠ 지시서 적용에서 **제외**한 항목 — 디바이스 최적화 자산 보존

21번에는 20번에 없는 모바일·태블릿 최적화 자산이 있었다. v5.0 규격으로 덮으면 오히려 동작이 나빠지므로 **원형을 보존**했다.

| 자산 | 위치 | 내용 | 제외 근거 |
|---|---|---|---|
| **iOS 자동확대 방지** | `@media screen and (max-width:768px)` | `input,select,textarea,.fx-input{font-size:16px!important}` | iOS Safari는 **16px 미만 입력란에 포커스하면 화면을 자동 확대**한다. 지시서 "입력·선택 13px"을 그대로 적용하면 모바일에서 입력할 때마다 화면이 튄다 |
| **터치 타깃 규격** | `@media(hover:none) and (pointer:coarse)` | 탭 40px · 버튼 38px · 입력 40px 최소높이 + hover 고착 방지 | 터치 조작성 확보. 21번 고유 자산 |

> **적용 경계 원칙 — "출력물은 규격 통일, 화면은 디바이스 우선"**
> v5.0 규격의 목적은 39종 **출력물(A4 계산서·JPG)의 통일**이다.
> 위 두 블록은 레이아웃 분기가 아닌 **기능 쿼리**이므로 브레이크포인트 6종 계수에서도 제외한다.

### ⑰ 디바이스 분기 통합 — `pages/` 계열 폐지

Ver 2.0은 두 계열이 **같은 계산을 이중으로 유지**하고 있었다.

```
[Ver 2.0]
start.html ── w≤640  → pages/mobile.html ┐
           ├─ w≤1024 → pages/tablet.html ┴→ css/style.css + js/engine.js + js/ui.js
           └─ 그 외   → index.html (인라인 style 607줄 + 함수 52개, 자급자족)

[Ver 5.0]
start.html ── 전 기기 → index.html (4단계 반응형 + iOS 16px + 터치 타깃)
```

폐지 근거는 셋이다.

| # | 근거 |
|---|---|
| 1 | `manifest.json` 의 `start_url` 이 `./index.html` 이고 `sw.js` PRECACHE 에도 `index.html` 만 있었다 → **PWA로 설치하면 `start.html` 을 건너뛰어** `pages/` 는 애초에 도달하지 않는다 |
| 2 | `pages/*` 는 navigate 요청이라 오프라인 시 Network First 폴백이 `./index.html` 로 잡혀 **엉뚱한 화면이 떴다** |
| 3 | 이중 유지가 실제 비용을 내고 있었다 — `engine.js` 와 `index.html` 의 16층 배수수직관 보정 조건문이 이미 갈라져 있었다 (`idx>=0` vs `idx>=0 && idx<len-1`). 산출값은 **78,060건 전수 대조 동일**했으나 다음 수정에서 갈릴 자리였다 |

`index.html` 이 이미 4단계 반응형·iOS 16px·터치 타깃을 모두 갖추고 있어 **기능 손실 없이** 통합됐다.

**저장소에서 삭제해야 할 파일** (로컬에는 보존)

```
pages/mobile.html   pages/tablet.html
css/style.css       js/engine.js       js/ui.js
```

### MANMIN A4 규격 (전 39종 공통)

| 항목 | 값 |
|------|-----|
| 용지 | A4 portrait 210 × 297mm |
| 여백 | 상 14 · 우 12 · 하 22 · 좌 14mm |
| 유효 영역 | **184 × 261mm** |
| 하단 각인 | `MANMIN · Ver-5.0` · Orbitron 8pt · `#9CA3AF` · 우측 하단 · 매 페이지 |
| 분야 주도색 | 기계설비 `#0E7490` *(21번은 원래부터 teal-700 계열 — 별도 이관 불필요)* |

### 버전 표기 3형식

| 형식 | 표기 | 사용처 |
|---|---|---|
| 문장형 | `MANMIN Ver-5.0` | `<title>` · 계산서 각주 · manifest |
| 각인형 | `MANMIN · Ver-5.0` | 헤더 각인 · `#dev-stamp` |
| 기계형 | `MANMIN-Ver5.0` | `var VER` (JPG 파일명) |

### JPG 저장 동작

```
위생배관관경_{공사명}_{YYYYMMDD}[_n].jpg
```

`window.MM_JPG_CONFIG = { zone:'#a4Page', name:'위생배관관경', prepare:'mmPrepareA4' }`

v5.4 는 `prepare` 를 **인자 없이** 호출한다(`window[CFG.prepare]()`). 21번 `renderA4(r)` 는 인자를 받으므로
`function mmPrepareA4(){ if(STATE && STATE.result) renderA4(STATE.result); }` 래퍼를 두었다. **`renderA4` 자체는 손대지 않았다.**
v5.4 가 참조하는 `#rpt-inner`(미리보기 축소 래퍼)는 21번의 `#a4ScaleWrap` 으로, `#btn-jpg` 는 A4 탭 JPG 버튼 id 로 맞췄다.

**바닐라 JS 계열이므로 `prepare` 에 계산서 빌드 함수명(`renderA4`)을 지정한다.**
React 계열(46 설계하중 등)의 `null` 을 그대로 쓰면 캡처 시점에 계산서가 비어 있을 수 있다.
`ui.js` 의 `renderA4Page` 가 아니라 `index.html` 인라인의 **`renderA4`** 가 최종 렌더 함수다.

### 검증 결과

| 검증 | 방법 | 결과 |
|------|------|------|
| 계산 로직 무변경 | 계산 구간 unified diff | **1행** — `renderMobile()` 호출 제거뿐 |
| 〃 | 숫자 토큰 다중집합 대조 | 326개 **완전 일치** (추가·삭제 0) |
| 〃 | 함수 시그니처 집합 | 추가·삭제 **0** |
| 〃 | 원본 vs v5.0 계산함수 실행 | **48,120건 불일치 0건** |
| 문법 | `node --check` | 인라인 script 2블록 **정상** |
| 태그 균형 | div·span·table·tr·td·button | **원본과 동일** |
| 보존 항목 | iOS 16px · 터치 타깃 | **원형 유지** |
| 기준본 | GitHub blob SHA | `7f947db1…` **일치 확인 후 착수** |

크기 **177,342 → 173,013 B** (−4,329 B · 모바일 목업 제거분)

### 근거 기준

| 구분 | 내용 |
|------|------|
| FU 기구부하단위 | **기계설비 기술기준 [별표 4]** 위생기구설비 |
| 급수·급탕 관경 | **[별표 5]** 급수ㆍ급탕설비 → 2.1.2·2.2.2 가 **[별표 8] 2.4·2.5** 로 위임 |
| 오배수·통기 관경 | **[별표 6]** 오ㆍ배수 통기 및 우수배수설비 2.1.2 → **[별표 8] 2.6** |
| 배관 호칭지름 | **[별표 8]** 배관설비 |
| 감압밸브 기준 | [별표 5] 2.1.7 — 위생기구 수압 **550 kPa** 이상 시 감압밸브 또는 급수 조닝 |
| 급탕온도 제한 | [별표 5] 2.2.7(2) — 위생기구 급탕온도 **43℃** 이하 |
| 급탕배관 길이 | [별표 5] 2.2.2(3) — 급탕열원~위생기구 **15m** 이하 |
| 출처 확인 | **LawMCP** (국가법령정보) 2026-08-31 조회 — 행정규칙일련번호 `2100000282424` |

> 고시는 2026. 7. 8. **제2026-360호**("정부조직 개편 사항 반영을 위한 57개 고시의 일부개정")로 일부개정됐다.
> 개정은 형식적 사항이며 **별표 4·5·6·8 의 번호·제목·위임구조와 위 수치 기준은 모두 현행 그대로**임을 조문 대조로 확인했다.

### 백업

| 파일 | 내용 |
|------|------|
| `index_백업_2026-08-31_원본.html` | v5.0 작업 직전 원본 (배포본과 SHA 일치 확인분) |

---

## 📁 파일 구성 (Ver 5.0 배포본)

```
📦 Sanitary-Piping-System/
├── 📄 index.html          # 메인 앱 (단일 진입점)
├── 📄 start.html          # 스플래시 — 전 기기 index.html 로 진입
├── 📄 install.html        # PWA 설치 안내
├── 📄 offline.html        # 오프라인 폴백
├── 📄 manifest.json       # PWA 매니페스트
├── 📄 sw.js               # Service Worker (manmin-v5.0.0)
├── 📄 favicon.ico · _config.yml · .nojekyll · .gitignore
├── 📁 assets/fonts/       # 로컬 폴백 폰트 (v5.0 신규)
│   ├── manmin-fonts.css
│   └── NotoSansKR-var.woff2
└── 📁 icons/              # 앱 아이콘
```

## 🚀 배포 시 주의 (작업지시서 §6)

| # | 항목 |
|---|---|
| 1 | 업로드 직전 **`Thumbs.db` 삭제** — 폴더를 열면 Windows 가 생성한다 |
| 2 | **`.nojekyll` 은 드래그로 안 올라간다** → `Add file → Create new file` 별도 커밋. **21번 저장소에는 현재 `.nojekyll` 이 없다** (20번과 같은 사고) |
| 3 | `assets/fonts/NotoSansKR-var.woff2` 는 **20번 `Roof-Drain` 폴더에서 복사**해 넣을 것 |
| 4 | `pages/` · `css/` · `js/` **3개 폴더 삭제 커밋** |
| 5 | 업로드 후 **전 파일 blob SHA 대조** |

---

*MANMIN · Sanitary Piping Sizing System · Ver 5.0*
