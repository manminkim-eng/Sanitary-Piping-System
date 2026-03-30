# 🔧 위생배관 관경 산정 시스템 MANMIN-Ver2.0

> 기계설비 기술기준 (국토교통부 고시 제2021-851호) 기준

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-0e7490?logo=pwa)](https://web.dev/progressive-web-apps/)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Deployed-green)](https://pages.github.com/)

## 📲 설치 방법

### Android / PC (Chrome · Edge)
1. 브라우저에서 앱 열기
2. **"앱 설치"** 배너 → **설치하기** 클릭
3. 또는 주소창 오른쪽 **⊕** 아이콘 클릭
4. 또는 `install.html` 페이지에서 플랫폼별 안내 확인

### iOS (Safari)
1. **Safari** 브라우저에서 앱 열기 (Chrome 불가)
2. 하단 **공유 버튼** (□↑) 탭
3. **홈 화면에 추가** 탭
4. 오른쪽 상단 **추가** 탭

---

## 📁 파일 구조

```
/
├── index.html              # 메인 앱 (PWA Controller v3.0)
├── sw.js                   # Service Worker v3.0
├── manifest.json           # PWA 매니페스트
├── offline.html            # 오프라인 폴백
├── install.html            # 플랫폼별 설치 가이드
├── favicon.ico
├── .nojekyll               # GitHub Pages Jekyll 비활성화
├── README.md
└── icons/
    ├── icon-16x16.png  ~  icon-512x512.png   (11종)
    ├── icon-maskable-512.png                  (adaptive icon)
    ├── apple-touch-icon.png                   (iOS 180×180)
    ├── brand-icon.jpg                         (헤더 로고)
    ├── favicon-16x16.png
    └── favicon-32x32.png
```

---

## ⚙️ Service Worker 캐시 전략

| 유형 | 전략 |
|------|------|
| HTML 네비게이션 | Network First |
| 정적 자산 (JS/CSS/이미지) | Cache First (24h) |
| Pretendard/Google Fonts | Stale-While-Revalidate |
| CDN (html2canvas 등) | Cache First (7일) |

---

## 🖥️ 반응형 지원

| 화면 | 범위 |
|------|------|
| 데스크탑 | ≥ 1100px · 배너 중앙 560px |
| 태블릿 | 768–1099px |
| 모바일 | < 768px |

---

## 🚀 GitHub Pages 배포

```bash
git init
git add .
git commit -m "feat: 급배수관경 PWA v3.0"
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
# → GitHub 저장소 Settings → Pages → main / (root)
```

---

*© ENGINEER KIM MANMIN — 기계설비 기술기준 제2021-851호*
