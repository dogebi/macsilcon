# 작업 컨텍스트

- 참조 이미지의 핵심 효과는 중앙 허브에서 여러 항목으로 뻗는 곡선 연결선, 선택 항목의 형광 그린 강조, 선택 결과의 상세 표시다.
- 기존 구현은 `mapCategories` 5개와 SVG 연결선을 이미 가지고 있으므로 새 그래프 라이브러리는 추가하지 않는다.
- 상세 정보는 현재 선택한 칩의 기존 `blocks` 데이터를 재사용해 맵 내부 패널에 표시한다.
- 2026-09-28: `mapDetail`을 중앙 허브와 카드 목록 사이에 추가했고, 카드 클릭 때 모듈 설명·지수·연도·타입을 갱신하도록 했다.
- 2026-09-28: 데스크톱에서는 우측 5개 카드와 곡선 연결선을 유지하고, 900px 이하에서는 orb → 상세 → 카드 그리드 순서로 쌓이게 했다.
- 2026-09-28: 칩 카탈로그는 M1~M5 세대를 부모 노드로 묶고 각 Pro/Max/Ultra 파생 모델을 자식 카드로 전개하는 트리 렌더링으로 변경했다.
- 2026-09-28: Knowledge Map은 모듈 5개 카드가 아니라 전체 18개 칩 모델을 같은 레벨의 3열 카드 맵으로 표시하고, 선택 모델의 5개 상세 스펙을 중앙 패널에 표시하도록 변경했다.
- 2026-09-28: EN/日本語/中文/한국어 선택기를 추가하고 핵심 정적 UI와 Knowledge Map 상세 라벨을 localStorage 기반으로 전환했다.
- 2026-09-28: 저장된 사용자 선택이 없을 때 `navigator.languages`와 `navigator.language`의 브라우저 설정을 감지해 초기 언어를 결정한다.
- 2026-09-28: 남아 있던 본문 `<p>`와 정적 버튼·푸터·범례 문구에도 번역 키를 연결하고, HTML이 포함된 제목은 `innerHTML` 방식으로 언어별 교체한다.
- 2026-09-28: JEV-OMNI는 referrer/UTM, 재방문, 섹션·카탈로그·맵·비교·언어 클릭, 체류 시간을 브라우저 localStorage에만 기록하고 explorer/catalog/analyst/returning 모드별 UI 강조를 적용한다.
# 2026-09-28 유지보수 결정

- 작업 순서는 인코딩 복구, localStorage 복구, 데이터·번역 모듈 분리, illustrative index 명시, 이미지 asset 로딩 전환으로 고정한다.
- 기존 UI 동작과 배포 base 경로는 유지하고, 각 단계마다 빌드 또는 최소 회귀 검증을 실행한다.
- 1단계: 파일 자체는 UTF-8로 정상이며 PowerShell 표시만 깨져 있었다. 중복된 `Object.assign(pageCopy.*)` Unicode escape 보정 블록만 제거했다.
- 2단계: `storage.js`의 `readStoredJson`이 JSON 파싱 및 storage 접근 예외를 기본값으로 복구한다.
- 3단계: `data.js`는 칩 배열을, `translations.js`는 번역과 본문 문구를 소유하며 `app.js`는 이를 import한다.
- 4단계: 칩 점수는 실제 벤치마크가 아닌 `ILLUSTRATIVE INDEX`로 UI에 표시하며, 비교 섹션의 비실험실 기준 안내를 유지한다.
- 5단계: 이미지 import에서 `?inline`을 제거해 Vite가 WebP를 별도 asset으로 배포하도록 했다. 초기 JS 번들이 약 586KB에서 21KB로 감소했다.

- Runtime map originally selected only the M1-M5 base chips, omitting Pro, Max, and Ultra variants. It now uses the full chips array and reuses each family image for its models.
- Verified the family infographics themselves name the base chip (for example, `Apple M1`) and show base-tier specs. Reuse those only for base chips; show a neutral model/type/year graphic for Pro/Max/Ultra until matching source art exists.
- Follow-up image review found the M4 and M5 infographics also contain incorrect specs. User supplied model-specific clean PNGs and confirmed `M1p_clean.png` is for M1 Pro. Import the supplied `_clean.png` set by filename and map each dataset model to its matching image.

## 2026-09-29: Image loading performance
- The journey renderer inserts all 18 clean PNGs at startup; each source is about 1.3-1.4 MB. This makes the browser request and decode a large image set before the user reaches those scenes.
- Keep the original PNGs as source assets. Generate WebP derivatives with Pillow at quality 90, update the existing Vite asset glob to use only those WebPs, and use native lazy loading for all but the first image.
- This keeps the first scene promptly available and defers offscreen downloads without adding a dependency or custom loader.

- Generated 18 canonical WebP assets: 2,057,338 bytes total versus 24,836,145 bytes of PNG sources (91.7% smaller); kept PNG originals untouched.
- `node --test test/*.test.mjs` passed (3 files), `npm run build` passed, and `git diff --check` reported no whitespace errors.
