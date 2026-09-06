# 담담히 MARKET DASHBOARD

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

스크립트는 사이트를 순서대로 방문하여 load 이후 6초 기다리고 실제 스크린샷을 저장합니다. HTTP 오류, 빈 화면, 알려진 접근 차단 문구를 확인하며 로그인·CAPTCHA·봇 차단을 우회하지 않습니다. 동적 콘텐츠의 완전한 로딩이나 모든 차단 화면의 자동 판별을 보장하지 않으므로 결과 이미지를 확인하세요. 쿠키 팝업은 임의 selector로 닫지 않습니다.

사이트마다 `[OK]` / `[FAIL]`을 출력합니다. 실패하면 기존 PNG를 보존하며 실패 기록만 갱신합니다. 정상 캡처는 임시 PNG를 완성한 후 교체합니다. `public/captures/manifest.json`에는 사이트별 실제 저장 시간, 최근 실패 이유, 전체 실행 완료 시간 및 마지막 전체 성공 시간을 기록합니다. 일부 또는 전체 사이트 실패도 나머지 작업을 계속하고 결과 기록을 남기므로 사이트 실패 자체는 프로세스를 실패시키지 않습니다. 파일 시스템 등 작업 자체의 오류는 실패로 종료합니다.

## 자동 캡처와 Vercel

`.github/workflows/capture.yml`은 GitHub Actions의 **Capture websites → Run workflow** 수동 실행과 매일 **07:00 KST (22:00 UTC)** 예약 실행을 지원합니다. 예약 작업은 GitHub 사정에 따라 지연될 수 있습니다.

기본 브랜치에서 npm ci → Chromium 및 시스템 의존성 설치 → 캡처 → 변경된 public/captures 커밋 및 push 순서로 실행합니다. 이미지뿐 아니라 상태/시간 manifest 변경도 커밋하므로 실패 기록도 대시보드에 전달됩니다. staged 변경이 전혀 없으면 커밋하지 않습니다.

기존 GitHub–Vercel 연동이 해당 브랜치의 push 배포를 허용해야 자동 재배포됩니다. GitHub의 Actions 쓰기 권한과 브랜치 보호 규칙이 bot push를 허용해야 합니다. 워크플로는 저장소 연결, 브랜치 보호, Vercel 설정을 변경하거나 force push하지 않습니다. 실제 Actions 실행과 Vercel 배포는 해당 서비스에서 확인해야 합니다.

웹 화면의 '저장된 캡처 다시 불러오기'는 배포된 manifest를 다시 읽습니다. 새로운 캡처는 로컬 명령 또는 Actions에서 실행해야 합니다.

## GitHub Actions 환경 진단 테스트

변경 파일을 기본 브랜치에 반영한 뒤 **Actions → Capture websites → Run workflow**에서 기본 브랜치를 선택해 실행합니다. `publish_captures`는 기본 false로, 테스트 결과만 남기며 저장소에 push하지 않습니다. true로 선택하면 정상 캡처와 상태 기록을 커밋합니다. 예약 실행의 자동 커밋은 유지됩니다.

각 사이트의 Actions 로그 그룹에는 HTTP status, 최종 URL, 페이지 title, `document.body.innerText` 및 `innerHTML` 문자 수, 성공/실패, 실패 이유를 JSON으로 출력합니다. 브라우저 생성 실패나 DOM 접근 실패로 확인할 수 없는 값은 null이며 별도의 diagnosticError를 남깁니다. navigation timeout이 발생해도 수신된 메인 문서 HTTP 응답을 기록합니다.

실행 페이지의 **Summary**에서 사이트별 결과 표를 확인하고, **Artifacts → website-capture-실행ID-시도번호**에서 `results.json`, `summary.md`, 이미지 및 manifest를 다운로드할 수 있습니다. Artifact에는 이전 정상 이미지도 포함될 수 있으므로 이번 실행 성공 여부는 results.json으로 판단하세요. 사이트별 실패는 후속 사이트 실행을 중단하지 않습니다. 설치나 파일 시스템 등 workflow 자체의 오류는 사이트 실패와 구분됩니다. 로그나 Summary에서 성공을 확인하기 전에는 GitHub Actions 캡처 성공으로 간주하지 않습니다.
