# MARKET DASHBOARD

실제 웹사이트의 Playwright Chromium 스크린샷만 표시하는 React + Vite 대시보드입니다. 금융 데이터 재구성, 모의 숫자, 차트 및 인포그래픽 생성 기능은 없습니다.

## 실행

```sh
npm ci
npm run capture:install
npm run capture
npm run dev
```

Linux에서 시스템 라이브러리가 부족하면 `npx playwright install --with-deps chromium`을 실행합니다.

`npm run lint`, `npm run build`로 검증합니다. 기존 Vite 빌드 출력은 `dist`이며 Vercel에서는 Playwright를 실행하지 않습니다.

## 대상 및 저장 방식

`src/data/sites.js`만 편집해 사이트를 추가하거나 삭제합니다. 각 항목은 id, title, category, url, screenshot, captureType, selector, viewport를 갖습니다. screenshot은 `/captures/파일명.png` 형식입니다.

현재 모든 사이트는 검증된 selector가 없어 `fullPage`로 시작합니다. 실제 확인한 안정적인 selector가 있을 때만 `captureType: 'element'`와 selector를 함께 지정하세요. `viewport`도 지원합니다. 네이버는 480×1000, 나머지는 1440×1080 화면을 사용합니다.

스크립트는 사이트를 순서대로 방문하여 DOM 로딩과 설정된 준비 요소를 확인하고 8초 기다린 뒤 실제 스크린샷을 저장합니다. HTTP 오류, 빈 화면, 알려진 접근 차단 문구를 확인하며 로그인·CAPTCHA·봇 차단을 우회하지 않습니다. 동적 콘텐츠의 완전한 로딩이나 모든 차단 화면의 자동 판별을 보장하지 않으므로 결과 이미지를 확인하세요. 쿠키 팝업은 임의 selector로 닫지 않습니다.

사이트마다 `[OK]` / `[FAIL]`을 출력합니다. 실패하면 기존 PNG를 보존하며 실패 기록만 갱신합니다. 정상 캡처는 임시 PNG를 완성한 후 교체합니다. `public/captures/manifest.json`에는 사이트별 실제 저장 시간, 최근 실패 이유, 전체 실행 완료 시간 및 마지막 전체 성공 시간을 기록합니다. 일부 또는 전체 사이트 실패도 나머지 작업을 계속하고 결과 기록을 남기므로 사이트 실패 자체는 프로세스를 실패시키지 않습니다. 파일 시스템 등 작업 자체의 오류는 실패로 종료합니다.

## 자동 캡처와 Vercel

`.github/workflows/capture.yml`은 GitHub Actions의 **Capture websites → Run workflow** 수동 실행과 매일 **07:00 KST (22:00 UTC)** 예약 실행을 지원합니다. 예약 작업은 GitHub 사정에 따라 지연될 수 있습니다.

기본 브랜치에서 npm ci → Chromium 및 시스템 의존성 설치 → 캡처 → 변경된 public/captures 커밋 및 push 순서로 실행합니다. 이미지뿐 아니라 상태/시간 manifest 변경도 커밋하므로 실패 기록도 대시보드에 전달됩니다. staged 변경이 전혀 없으면 커밋하지 않습니다.

GitHub–Vercel 연동으로 main 브랜치 push 시 운영 사이트가 자동 배포됩니다. 2026-09-09에 예약 캡처 커밋의 Production 배포 성공을 확인했습니다. GitHub의 Actions 쓰기 권한과 브랜치 보호 규칙이 bot push를 허용해야 합니다. 워크플로는 저장소 연결, 브랜치 보호, Vercel 설정을 변경하거나 force push하지 않습니다. 실제 Actions 실행과 Vercel 배포는 해당 서비스에서 확인해야 합니다.

웹 화면의 '저장된 캡처 다시 불러오기'는 배포된 manifest를 다시 읽습니다. 새로운 캡처는 로컬 명령 또는 Actions에서 실행해야 합니다.

## GitHub Actions 환경 진단 테스트

변경 파일을 기본 브랜치에 반영한 뒤 **Actions → Capture websites → Run workflow**에서 기본 브랜치를 선택해 실행합니다. `publish_captures`는 기본 false로, 테스트 결과만 남기며 저장소에 push하지 않습니다. true로 선택하면 정상 캡처와 상태 기록을 커밋합니다. 예약 실행의 자동 커밋은 유지됩니다.

각 사이트의 Actions 로그 그룹에는 HTTP status, 최종 URL, 페이지 title, `document.body.innerText` 및 `innerHTML` 문자 수, 성공/실패, 실패 이유를 JSON으로 출력합니다. 브라우저 생성 실패나 DOM 접근 실패로 확인할 수 없는 값은 null이며 별도의 diagnosticError를 남깁니다. navigation timeout이 발생해도 수신된 메인 문서 HTTP 응답을 기록합니다.

실행 페이지의 **Summary**에서 사이트별 결과 표를 확인하고, **Artifacts → website-capture-실행ID-시도번호**에서 `results.json`, `summary.md`, 이미지 및 manifest를 다운로드할 수 있습니다. Artifact에는 이전 정상 이미지도 포함될 수 있으므로 이번 실행 성공 여부는 results.json으로 판단하세요. 사이트별 실패는 후속 사이트 실행을 중단하지 않습니다. 설치나 파일 시스템 등 workflow 자체의 오류는 사이트 실패와 구분됩니다. 로그나 Summary에서 성공을 확인하기 전에는 GitHub Actions 캡처 성공으로 간주하지 않습니다.

## 별도 API 데이터 페이지

`/data`는 Alpha Vantage GLOBAL_QUOTE를 조회하는 별도 페이지입니다. 캡처 대시보드에서 링크로 이동합니다. 임의 숫자나 차트를 만들지 않으며 API 응답의 가격 문자열과 거래일을 표시합니다. 자동 조회 없이 티커를 입력해 요청합니다.

Vercel 프로젝트 Settings → Environment Variables에 `ALPHA_VANTAGE_API_KEY`를 Production 환경변수로 등록한 후 재배포하세요. 키는 `VITE_` 접두사를 붙이지 않습니다. 로컬은 `.env.local`에 같은 이름으로 설정하고 `npm run dev`로 실행합니다. `.env.local`은 Git에서 제외됩니다. API 키는 브라우저 응답이나 저장소에 포함하지 않습니다.

Vercel Node 함수 `api/quote.js`가 실제 API를 호출합니다. 성공 응답만 인스턴스 메모리 및 CDN에 최대 1시간 캐시합니다. 메모리 캐시는 인스턴스별이므로 하루 요청량을 엄격히 제한하는 전역 저장소는 아닙니다. 무료 호출 한도나 API 제한 응답, 연결 실패, 없는 종목은 오류 메시지로 표시합니다. 출처와 API 조회 시간은 거래일과 구분합니다. 기본 GLOBAL_QUOTE는 거래일 종료 기준이며 실시간이 아닙니다. 공식 문서: https://www.alphavantage.co/documentation/#latestprice

검증: `node --test tests/quote.test.mjs`. 오류 처리 테스트는 시세 숫자나 이미지를 생성하지 않습니다.

## 모바일 캡처 전용 모드

768px 이하에서 카드(또는 이미지)를 탭하면 캡처 모드가 열립니다. 원본 PNG를 그대로 불러오고 CSS transform으로만 확대·이동합니다. 처음에는 화면 너비에 맞춰 표시하며, 이후에는 사이트별로 저장한 위치를 복원합니다.

- 두 손가락 pinch: 확대·축소. 천천히 한 손가락 드래그: 위치 이동.
- 빠른 가로 스와이프: 이전/다음 사이트. 350ms 미만, 90px 이상, 가로 이동이 세로의 2배 초과인 동작을 화면 전환으로 구분합니다. 가로 위치를 조정하려면 천천히 드래그하세요.
- 한 번 탭: 이전 / 초기화 / 위치 저장 / 다음 / 닫기 버튼을 2초간 표시합니다.
- 조작을 마치면 scale, translateX, translateY를 localStorage의 사이트별 키에 자동 저장합니다. 위치 저장 버튼도 동일한 위치를 저장합니다. 초기화는 화면 너비 기준 위치로 돌아가 저장합니다.
- 이미지가 없는 사이트는 순회에서 제외합니다. 최근 캡처가 실패했어도 기존 이미지가 있으면 포함합니다. 마지막 사이트 다음은 첫 사이트입니다.
- 컨트롤이 사라진 후 휴대폰의 기본 스크린샷 기능을 사용하세요. 앱 내 UI는 숨기지만 브라우저 자체 주소창이나 운영체제 상태바는 웹페이지 CSS로 숨길 수 없습니다.

검증: 개발 서버를 실행한 뒤 `npm run test:capture-mode` (기본 http://127.0.0.1:5174). 다른 주소는 TEST_BASE_URL로 지정합니다. Chromium의 모바일 viewport와 CDP 터치 입력으로 pinch/drag/swipe를 검증하며 실제 iOS Safari 또는 Android 기기 테스트를 대신하지 않습니다.

## 미국시장 스캐너

`/scanner`에서 CORE(priority=1, 21종목) / FULL(37종목)을 선택합니다. 모바일 하단 내비게이션으로 시장 캡처와 전환합니다. 섹션·티커·설명·priority·차트 URL은 Python 원본을 옮긴 `src/data/watchlist.js` 한 곳에서 관리합니다.

`npm run capture:finviz`는 Actions에서 실제 Finviz 차트를 다운로드하여 `public/finviz/TICKER.png`에 저장합니다. 웹브라우저는 Finviz에 요청하지 않습니다. 원본의 도메인 순서(charts2.finviz.com, finviz.com)를 사용하며 403/429 명시적 거부 응답 시 다른 호스트로 재시도하지 않습니다. HTTP 실패, 이미지가 아닌 응답, 이미지 디코딩 실패 시 기존 정상 파일과 저장 시간을 보존합니다. 매번 manifest에 최근 상태와 실패 이유를 기록합니다.

차트의 크기를 바꾸지 않고 PNG로 저장합니다. 각 모드의 모든 차트가 이번 실행에 성공한 경우에만 원본 이미지를 순서대로 세로 연결하여 `market_scan_YYYY-MM-DD_core.png` / `market_scan_YYYY-MM-DD_full.png`를 만듭니다. 날짜는 실행 시작 시각의 미국 뉴욕 날짜입니다. 일부 실패 시 해당 모드의 이전 정상 한 장 이미지를 유지합니다. 실제 차트 외에 금융 값이나 그래프를 생성하지 않습니다.

한 장 이미지 버튼과 각 티커 이미지는 기존 CaptureMode를 재사용합니다. `finviz:TICKER` 식별자로 위치를 저장하므로 시장 캡처와 저장 위치가 섞이지 않습니다. CORE/FULL을 전환해도 같은 티커는 같은 위치를 사용합니다.

기존 Capture websites 워크플로에 Finviz 단계를 추가했습니다. 수동 실행은 선택한 브랜치를 테스트하고, 자동 커밋은 기본 브랜치의 예약 실행 또는 publish_captures=true인 수동 실행만 허용합니다. Actions Summary와 artifact의 finviz-results에서 실제 성공/실패를 확인할 수 있습니다. 전체 워크플로 시간 제한은 두 작업을 위해 45분입니다.

모바일 검증: 개발 서버 실행 후 `node scripts/test-scanner.mjs`. 기본 포트 5174, TEST_BASE_URL로 변경 가능. 이미지가 없으면 해당 이미지 모달 검증은 미확인으로 보고합니다.

## 2026-09-09 홈페이지 개편 및 지표 복구

메인을 국내증시 / 미국증시 / 시장 폭·심리로 묶고 PC 3열(중간 크기 2열), 모바일 1열로 표시합니다. 상단에는 저장 수, 마지막 캡처 실행 시각, 갱신 상태와 예약 일정을 표시합니다. 갱신 실패 시 이전 정상 이미지를 유지하며 원본 링크를 제공합니다. 메인 소개글과 브라우저 제목의 ‘담담히’를 삭제했습니다.

접근 오류가 반복되던 네 지표의 캡처 출처를 변경했습니다. 카드에 제공사와 기준을 명시하며 실제 웹페이지 이미지를 저장합니다.

| 지표 | 캡처 출처 | 기준 |
|---|---|---|
| ADR | https://jusikbot.com/adr | 코스피·코스닥 20거래일 상승/하락 종목수 비율 |
| 미국 섹터 | https://www.tradingview.com/markets/stocks-usa/sectorandindustry-sector/ | TradingView 섹터 분류. 기존 Finviz 분류와 다름 |
| S&P 500 히트맵 | https://www.tradingview.com/heatmap/stock/ | S&P 500, 시가총액 크기·일간 등락 색상 |
| 미국 공포·탐욕 | https://feargreedmeter.com/fear-and-greed-index | Fear & Greed Meter 제공 화면. CNN 원본 캡처가 아님 |

변경한 사이트는 차트 또는 표 준비 요소를 기다립니다. ADR의 실제 확인된 ‘닫기’ 버튼으로 공지 팝업을 닫고 본문을 캡처합니다. manifest에 sourceUrl도 기록합니다.

`Capture websites`는 매일 07:00 KST뿐 아니라 main의 캡처 코드·지표 목록·워크플로 변경 때도 실행합니다. 캡처 이미지 커밋은 이 push 트리거에서 제외되어 반복 실행하지 않습니다. 일부 사이트가 실패해도 정상 이미지와 상태를 먼저 커밋하고, 마지막 상태 점검에서 실행을 실패로 표시하여 누락이 성공으로 감춰지지 않도록 합니다. Vercel은 커밋을 자동 배포합니다. `Verify application`은 코드 push와 PR에 lint, API 테스트, build를 실행합니다.

검증 명령: `node scripts/check-dashboard.mjs`, `node scripts/test-capture-mode.mjs`, `node scripts/test-scanner.mjs` (개발 서버 포트 5174). 대시보드 검증은 카테고리 전환, PC/모바일 오버플로, 소개글, 브라우저 오류를 확인합니다.
