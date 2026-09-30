# WebMCP 사용 방법

Silicon Atlas는 브라우저 지원 여부에 따라 페이지 로드 시 `list_mac_chips`, `get_mac_chip_specs`, `compare_mac_chips` 도구를 `document.modelContext.registerTool()`로 등록합니다. 칩 사양 조회 응답은 화면에 표시된 모듈 값과 `memoryBandwidth`를 반환합니다. 비교 응답은 이 값을 `chips`에, 시각화용 예시 지수는 `illustrativeIndices`에 따로 담습니다.

## Chrome에서 확인

2026-09-30 기준 WebMCP는 실험 단계입니다. 최신 Chrome 149에서 WebMCP Origin Trial에 등록하거나 로컬 검증 시 `chrome://flags/#enable-webmcp-testing`을 활성화한 뒤 브라우저를 다시 시작하세요. GitHub Pages HTTPS 주소를 열고 DevTools Console에서 다음을 실행합니다.

```js
window.macCompareWebMCP
await document.modelContext.getTools()
```

첫 결과의 `registered`가 세 도구를 포함하고 오류가 없어야 합니다. 실제 실행 예시.

```js
const tools = await document.modelContext.getTools();
const compare = tools.find(tool => tool.name === 'compare_mac_chips');
await document.modelContext.executeTool(compare, { left: 'M3 Max', right: 'M3 Ultra' });
```

`chips` 응답에 M3 Max `400 GB/s`, M3 Ultra `800 GB/s`가 포함됩니다. 같은 결과의 `illustrativeIndices`는 사이트 내 시각화용 점수이며 `MEMORY BANDWIDTH INDEX`를 포함해 실제 대역폭 단위값과 분리됩니다.

WebMCP는 웹사이트가 기능을 등록하는 API이고, 도구 호출은 이를 지원하는 브라우저 내 agent나 WebMCP Inspector가 담당합니다. 일반 ChatGPT 웹 fetch는 이 페이지의 브라우저 도구에 연결되지 않으므로, ChatGPT에서 호출하려면 WebMCP를 지원하는 브라우저 agent/연동이 필요합니다. Chrome 문서에 설명된 Inspector로 도구 등록과 실행도 확인할 수 있습니다.

참고: [Chrome WebMCP 안내](https://developer.chrome.com/docs/ai/webmcp), [Chrome 등록 도구 점검](https://developer.chrome.com/docs/lighthouse/agentic-browsing/registered-webmcp-tools).
