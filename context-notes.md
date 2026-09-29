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

## 2026-09-29 개선 작업
- `index.html`과 `app.js`는 UTF-8로 정상 저장되어 있고 기존 콘텐츠 테스트가 일본어·중국어·한국어 문자열을 확인한다. PowerShell 기본 출력에서만 깨져 보였으므로 관련 소스는 수정하지 않는다.
- 지표는 `data.js`의 예시 점수 평균으로 표시하고, `CONFIDENCE`처럼 통계적 확신으로 오해될 이름은 제거한다.
- 앱은 localStorage를 프로필 기록과 언어 선호에 사용한다. 저장소 차단은 기능을 막지 않도록 처리한다.
- 작업 전 상태: `master`가 `origin/master`보다 한 커밋 앞서며, `assets/M1p_preview.svg`와 `assets/test.svg`는 미추적 사용자 파일이므로 포함하거나 수정하지 않는다.
- 1단계 완료: orb의 `CONFIDENCE` 퍼센트를 다섯 모듈 예시 점수의 평균값으로 바꾸고 4개 언어의 `AVERAGE INDEX` 라벨을 연결했다. `node --test test/*.test.mjs`, `npm run build`, `git diff --check` 통과.
- 2단계 완료: localStorage 객체 접근과 get/set을 안전하게 감싸고, 저장이 실패해도 세션 내 화면 동작은 유지하도록 했다. 차단된 저장소 동작을 회귀 검사로 추가했다. `node --test test/*.test.mjs`, `npm run build`, `git diff --check` 통과.
- 3단계 완료: 4개 언어로 로컬 방문·체류·클릭·유입 정보와 언어 설정 저장을 알리고, 프로필 삭제 버튼을 추가했다. 삭제 뒤에는 현재 페이지 수집을 멈추고 저장 실패 시에도 상태 문구로 알린다. `node --test test/*.test.mjs`, `npm run build`, `git diff --check` 통과.
- 4단계 완료: `npm test`를 `node --test`로 연결하고 4개 언어의 새 프로필 안내 문구를 확인하는 회귀 검사를 추가했다. `npm test` 3개 테스트 통과, `npm run build` 성공, `git diff --check` 통과.

## M6 카탈로그 업데이트
- Apple Korea 기술 사양에서 M6의 12코어 CPU(슈퍼 2/성능 4/효율 6), 12코어 GPU, 듀얼 16코어 Neural Engine, 153/170GB/s 메모리 대역폭, AV1 디코딩 및 H.264/HEVC/ProRes/ProRes RAW 미디어 지원을 확인했다.
- M6 기본형은 2026년형 Mac mini에 출시됐다. M6 Pro/Max/Ultra 공식 제품이나 사양은 확인되지 않았다. 2026-08-28 MacRumors는 Bloomberg 보도를 근거로 M6 Pro/Max 생략 가능성을 전하지만, 확인되지 않은 로드맵 보도이므로 실제 모델 데이터가 아닌 참고 주석으로만 표시한다.
- M6의 코어 수와 대역폭 등은 공식 사양으로 표시하고, 기존 앱 지수는 실험실 벤치마크가 아닌 시각화용 예시값임을 그대로 유지한다.
- 사전 확인 상태: `master`와 `origin/master` 동기화. 미추적 `assets/M1p_preview.svg`, `assets/test.svg`는 사용자 파일로 유지한다.
- M6용 `metrics` 및 막대 점수는 기존 UI 패턴을 유지하기 위한 자체 예시값이다. Apple이 발표한 12코어·170GB/s 등의 사양과 혼동하지 않도록 앱의 `ILLUSTRATIVE INDEX` 고지를 유지했고, M6 상세 카드에서 Apple 공식 지원 사양으로 연결한다.
- 비교 맵은 19개 모델로 갱신하고 세대 수는 M1~M6의 6개로 표시한다. Pro/Max/Ultra 추정값은 모델 데이터에 만들지 않는다.
- 검증 완료: `npm test` 3개 통과, `npm run build` 성공, `git diff --check` 통과. 미추적 SVG 두 파일은 이번 변경에 포함하지 않는다.

## 2026-09-29 M6 인포그래픽
- M1~M5 참조물은 밝은 회색 라운드 카드, 중앙 칩, 청록-검정-파랑 그라데이션 수치, 좌측 메모리·Neural Engine, 우측 대역폭·CPU·GPU, 하단 공정·출시 제품 배치다.
- M6 원본 칩 이미지를 중앙 시각 기준으로 사용한다. Apple 공식 보도자료에 나온 M6 2nm, 12코어 CPU/GPU, 듀얼 16코어 Neural Engine, 최대 32GB 메모리, 최대 170GB/s만 그래픽에 넣고 미공개 트랜지스터 수는 만들지 않는다.
- 공식 출처: https://www.apple.com/newsroom/2026/08/apple-unveils-a-more-powerful-mac-mini-featuring-the-all-new-m6-and-m5-pro/ .
- 1672×941 인포그래픽을 생성하고 `assets/chip-m6.webp`로 변환했다. 107,596 bytes이며 기존 `chip-*.webp` Vite glob으로 M6 카드에서 불러온다.
- 이미지 텍스트와 배치에서 M6 공식 정보가 반영된 것을 확인했다. `npm test` 3개 파일 통과, `npm run build` 성공, 결과물에 `chip-m6-*.webp` 포함, `git diff --check` 이상 없음.

## JEV-OMNI 실시간 맞춤 UI 설계
- 현재 프로필은 visits/clicks/models/sources/dwellSeconds를 localStorage에 보관한다. `omniSegment()`는 누적 카탈로그·맵 클릭과 재방문 우선순위로 세그먼트를 정하고 `trackOmni()`가 행동 직후 클래스를 갱신한다.
- 현재 CSS는 세그먼트에 따라 일부 섹션 테두리와 제목을 강조한다. 그러나 CPU·GPU·Neural 모듈 자체에는 독립 선택/관심 이벤트가 없다. `renderKnowledgeMap()`은 모듈 행을 생성하지만 클릭 처리하지 않는다.
- 사용자는 CPU·GPU·Neural 관심 강조와 방문 목적에 따른 섹션 순서·상세 수준의 자동 조정을 승인했다. 구현 전 설계 문서를 검토받는 단계로 진행한다.
- 실시간 조정 중 포커스/스크롤 점프 방지, 보수적인 신뢰도 기준, 로컬 처리·프로필 삭제/기본 화면 복귀를 필수 제약으로 둔다.
- 설계 문서 자체 검토에서 신호 점수와 섹션 순서 임계값을 명시하고, 기존 누적 방문 수가 현재 의도를 덮어쓰지 않도록 분리했다. 이 단계는 문서만 변경하며 구현은 사용자의 문서 검토 이후 계획한다.
- 사용자가 설계 문서를 승인했다. 구현 계획은 순수 의도 계산/테스트, JEV 이벤트·설정 연결, 접근성 있는 화면 적응, 통합 검증 순서로 작성했다. CPU/GPU/Neural 선택은 빠르게 반영하고, 섹션 재정렬은 비교 대상 두 칩 선택 또는 모듈 점수 5 이상일 때로 제한한다.
- 계획의 비교 의도는 코드의 기본 M1/M2 선택 상태를 고려해 방문자가 카탈로그에서 실제 비교쌍을 변경했는지로 판정한다. 불완전한 쌍이 되면 비교 의도를 해제한다.
- Task 1에서 `jev-personalization.js`에 10분 반감기 점수 모델, CPU/GPU/Neural 관심과 비교 의도 판정, 결정적 섹션 순서 및 단일 칩 선택 복구를 추가했다. `node --test test/jev-personalization.test.mjs`에서 8개 테스트가 통과했다.
- Task 2에서 로컬 맞춤 설정 토글, CPU/GPU/Neural 지도·비교 조작, 8초 마우스·펜 체류 신호, 한국어·영어·일본어·중국어 라벨을 연결했다. 기존 프로필의 `moduleInterest` 누락은 빈 선호도로 보정하고, 이전 방문 횟수만으로 Returning 모드를 선택하지 않는다. `npm test`(11개)와 `npm run build`가 통과했다.
- Task 3에서 CPU/GPU/Neural 포커스에 따라 각 화면의 세부도를 조정하고, 지식 지도·비교·카탈로그 및 탐색 레일을 의도별 순서로 재배치한다. 스크롤 중과 키보드 포커스가 옮길 섹션 안에 있을 때 재배치를 미루며, 같은 순서에서는 DOM 노드를 이동하지 않고 보이는 섹션의 화면 위치와 포커스를 보존한다. 비활성화와 프로필 삭제는 기본 순서·요약 상태로 복귀한다. `npm test`(11개), `npm run build`, `git diff --check`가 통과했다.
- 실제 브라우저 상호작용 검증은 수행하지 못했다. 현재 환경에 Chrome/Edge/Firefox 실행 파일과 Playwright/Puppeteer/jsdom이 없어 화면 조작을 재현할 수 없다.
