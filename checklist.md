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
- [x] Use neutral, model-labeled artwork for variants and M4/M5, whose available infographics contain incorrect specs.
- [x] Run the tests and production build.
