# 작업 체크리스트

- [x] 맵에 5개 모듈 카드를 모두 표시한다.
- [x] 카드 클릭 시 선택 모듈의 상세 패널을 갱신한다.
- [x] 선택 카드와 연결선에 참조 이미지의 그린 trace 효과를 적용한다.
- [x] 기존 칩 비교 및 리셋 동작을 보존한다.
- [x] 빌드와 최소 브라우저 동작 검사를 실행한다.
- [x] Knowledge Map에서 M1~M5 전체 18개 모델을 같은 레벨 카드로 전개한다.
- [x] 영어·일본어·중국어·한국어 언어 전환을 추가한다.
- [x] 본문 p 태그와 정적 UI 문구가 선택 언어에 맞게 모두 변경되는지 확인한다.
- [x] JEV-OMNI 방문자 행동 기반 UI 모드와 로컬 프로필 저장을 추가한다.
# 2026-09-28 유지보수 작업

- [x] 1. HTML과 번역 문자열의 인코딩 손상 수정 및 검증.
- [x] 2. localStorage 파싱 실패 시 기본값 복구 및 검증.
- [x] 3. 칩 데이터와 번역 데이터를 별도 모듈로 분리 및 검증.
- [x] 4. 수치 데이터가 illustrative index임을 명시하고 출처 문구 추가.
- [x] 5. 칩 이미지를 일반 asset 로딩으로 변경하고 빌드 검증.
- [x] 전체 빌드 및 최소 회귀 테스트 통과.

- [x] Found that the runtime map listed only base chips.
- [x] Connected the runtime map scenes to the complete chip dataset.
- [x] Added regression coverage for Pro and Max models.
- [x] Ran the relevant tests and production build.
- [x] Confirmed that M1 Pro/Max were being shown the M1 base infographic.
- [x] Copy the supplied model-specific clean images into assets and map each chip model to its matching filename.
- [x] Run the tests and production build.

## Image loading performance (2026-09-29)
- [x] Convert clean chip PNGs to optimized WebP assets while retaining PNG sources.
- [x] Load the first visible infographic eagerly and defer the remaining images with native lazy loading.
- [x] Run the content checks and production build; compare generated image sizes.

## 2026-09-29 개선 작업
- [x] PowerShell 출력과 UTF-8 파일을 구분해 인코딩 손상 여부 확인.
- [x] CONFIDENCE 표기를 산정 가능한 평균 예시 지수로 수정.
- [x] localStorage 접근·저장 실패 시 앱 기능 유지.
- [x] 로컬 이용 기록 안내 및 삭제 기능 제공.
- [x] `npm test` 스크립트 추가 후 테스트와 빌드 검증.
- [x] 순서대로 변경을 커밋하고 원격에 푸시.





## M6 카탈로그 업데이트
- [x] Apple 공식 사양과 출처 링크가 있는 M6 기본형 추가.
- [x] M6 추가에 맞춰 세대·모델 개수와 소개 문구 갱신.
- [x] M6 Pro/Max/Ultra의 공식 미발표 상태와 확인되지 않은 Pro/Max 보도를 4개 언어로 구분해 안내.
- [x] 테스트 및 빌드 검증, 커밋, 푸시.



## M6 인포그래픽 에셋
- [x] 사용자 제공 M6 칩 이미지를 중심으로 M1~M5와 같은 카드형 인포그래픽 생성.
- [x] 공식 M6 사양 텍스트와 이미지 자산 연결을 확인.
- [x] 프로덕션 빌드와 diff 검사 통과, 커밋 및 푸시 완료.

## JEV-OMNI 실시간 맞춤 UI 설계
- [x] 현재 방문 신호와 화면 구조를 코드에서 확인.
- [x] 의도 추정, CPU·GPU·Neural 강조, 섹션 순서·상세 수준 규칙을 설계 문서로 작성하고 자체 검토.
- [x] 설계를 커밋·푸시하고 사용자 검토 요청.
- [x] 사용자 승인 후 구현 계획 작성.
- [x] 사용자의 순차 구현 지시에 따라 현재 체크아웃에서 구현 시작.
- [x] Task 1 의도 모델 및 Node 테스트 8개 추가, 집중 테스트 통과.
- [x] Task 2 JEV 프로필, 모듈 제어, 설정 토글, 4개 언어 번역 연결. `npm test`와 `npm run build` 통과.
- [x] Task 3 모듈별 상세·강조, 섹션 순서·레일 동기화, 포커스·스크롤 보존 연결. 자동 테스트와 빌드 통과.
- [x] 브라우저 바이너리와 Playwright 등 자동화 도구가 없어 실브라우저 조작 검증은 생략하고 제한을 기록.
- [x] Task 4 전체 테스트 11개 통과, 프로덕션 빌드 성공, 공백 검사 통과, 구현 커밋·푸시 완료.


## WebMCP 구조화 칩 조회
- [x] 기존 WebMCP 등록 코드와 실제 등록 조건을 확인한다.
- [x] 모델 사양 및 M3 Max/M3 Ultra memory bandwidth 조회 tool을 제공한다.
- [x] 도구 등록 결과 및 M3 대역폭 값을 회귀 테스트한다.
- [x] Chrome/WebMCP-capable agent 사용 조건과 한계를 문서화한다.
- [x] 테스트, 빌드, diff 검사 후 변경 파일을 검토한다.
