# JEV-OMNI Real-Time Personalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the site adapt in real time to visitors' CPU, GPU, Neural, comparison, and architecture-exploration interests by changing focus, content density, and content-section order.

**Architecture:** Keep intent scoring and section-order decisions in a small pure ES module, covered by Node's built-in test runner. Integrate it with the existing JEV local profile and DOM renderers; adapt the three content sections in place, keep the generation overview fixed, and preserve keyboard focus and scroll position.

**Tech Stack:** Vanilla JavaScript ES modules, Vite, HTML/CSS, browser `localStorage`, `IntersectionObserver`, `node:test`.

---

## File Map

- Create `jev-personalization.js` for decayed session scores, inferred intent, remembered module preference, and deterministic section order.
- Create `test/jev-personalization.test.mjs` for pure scoring, thresholds, tie behavior, and order selection.
- Modify `app.js` to connect JEV events, the profile preference, module focus controls, dwell signals, adaptive DOM order, and section-rail observation.
- Modify `index.html` to add a personalization toggle and a polite status region, retaining the existing profile-clear control.
- Modify `styles.css` for focused/compact module states, adaptive section transitions, responsive behavior, and reduced-motion support.
- Modify `translations.js` for all new controls, announcements, and module labels in English, Korean, Japanese, and Chinese.
- Modify `test/modules.test.mjs` to assert the new translation keys exist in all four languages.
- Modify `test/content.test.mjs` to assert the personalization controls are present in HTML.
- Update `checklist.md` and `context-notes.md` as tasks complete. Do not edit the user's untracked `assets/M1p_preview.svg` or `assets/test.svg`.

## Task 1: Build and test the deterministic intent model

**Files:**
- Create: `jev-personalization.js`
- Create: `test/jev-personalization.test.mjs`

- [ ] **Step 1: Add failing intent-model tests**

Create `test/jev-personalization.test.mjs` with these test cases using `node:test` and `node:assert/strict`:

```js
// JEV 의도 점수와 적응 순서를 검사하는 테스트
import test from 'node:test';
import assert from 'node:assert/strict';
import { createJevIntentState, getJevIntent, getJevSectionOrder, recordJevSignal, updateSelectedChips } from '../jev-personalization.js';

test('explicit module focus immediately selects a module and records preference', () => {
  const state = recordJevSignal(createJevIntentState({}, 0), { type: 'module-focus', module: 'neural' }, 0);
  assert.equal(state.focusModule, 'neural');
  assert.equal(state.scores.neural, 3);
  assert.equal(state.modulePreferences.neural, 1);
  assert.equal(getJevIntent(state), 'explore');
});

test('module focus plus comparison inspection establishes architecture intent', () => {
  let state = createJevIntentState({}, 0);
  state = recordJevSignal(state, { type: 'module-focus', module: 'gpu' }, 0);
  state = recordJevSignal(state, { type: 'module-compare', module: 'gpu' }, 0);
  assert.equal(getJevIntent(state), 'architecture');
  assert.deepEqual(getJevSectionOrder(getJevIntent(state)), ['knowledgeMapSection', 'compare', 'catalog']);
});

test('dwell counts only after eight seconds and never resolves intent alone', () => {
  let state = createJevIntentState({}, 0);
  state = recordJevSignal(state, { type: 'module-dwell', module: 'cpu', durationMs: 7999 }, 0);
  assert.equal(state.scores.cpu, 0);
  state = recordJevSignal(state, { type: 'module-dwell', module: 'cpu', durationMs: 8000 }, 1);
  assert.equal(state.scores.cpu, 1);
  assert.equal(getJevIntent(state), 'explore');
});

test('session scores decay by half over ten minutes', () => {
  let state = recordJevSignal(createJevIntentState({}, 0), { type: 'module-focus', module: 'cpu' }, 0);
  state = recordJevSignal(state, { type: 'module-dwell', module: 'gpu', durationMs: 0 }, 600000);
  assert.equal(state.scores.cpu, 1.5);
});

test('comparison intent requires a visitor-changed pair of two different chips', () => {
  let state = createJevIntentState({}, 0);
  state = recordJevSignal(state, { type: 'comparison-changed', source: 'catalog', chipNames: ['M1', 'M1'] }, 0);
  assert.equal(getJevIntent(state), 'explore');
  state = recordJevSignal(state, { type: 'comparison-changed', source: 'catalog', chipNames: [undefined, 'M3'] }, 0);
  assert.equal(getJevIntent(state), 'explore');
  state = recordJevSignal(state, { type: 'comparison-changed', source: 'catalog', chipNames: ['M3', 'M4 Pro'] }, 1);
  assert.equal(getJevIntent(state), 'compare');
  assert.deepEqual(getJevSectionOrder('compare'), ['compare', 'catalog', 'knowledgeMapSection']);
  state = recordJevSignal(state, { type: 'comparison-changed', source: 'catalog', chipNames: ['M3'] }, 2);
  assert.equal(getJevIntent(state), 'explore');
  state = recordJevSignal(state, { type: 'comparison-changed', source: 'catalog', chipNames: ['M3', 'M4 Pro'] }, 3);
  state = recordJevSignal(state, { type: 'module-focus', module: 'cpu' }, 3);
  assert.equal(getJevIntent(state), 'compare');
  state = recordJevSignal(state, { type: 'module-focus', module: 'cpu' }, 3);
  assert.equal(getJevIntent(state), 'architecture');
});

test('default order is stable when intent is broad or unknown', () => {
  assert.deepEqual(getJevSectionOrder('explore'), ['catalog', 'knowledgeMapSection', 'compare']);
  assert.deepEqual(getJevSectionOrder('unknown'), ['catalog', 'knowledgeMapSection', 'compare']);
});

test('past explicit preference focuses a clear favorite but ties remain neutral', () => {
  assert.equal(createJevIntentState({ cpu: 4, gpu: 2, neural: 1 }, 0).focusModule, 'cpu');
  assert.equal(createJevIntentState({ cpu: 3, gpu: 2, neural: 1 }, 0).focusModule, null);
});

test('chip selection can recover from a one-chip pair without adding undefined', () => {
  assert.deepEqual(updateSelectedChips(['M1', 'M2'], 'M1'), ['M2']);
  assert.deepEqual(updateSelectedChips(['M2'], 'M3'), ['M2', 'M3']);
  assert.deepEqual(updateSelectedChips(['M2', 'M3'], 'M4'), ['M3', 'M4']);
});
```

- [ ] **Step 2: Run the tests and confirm the module is missing**

Run: `node --test test/jev-personalization.test.mjs`

Expected: FAIL because `jev-personalization.js` does not exist.

- [ ] **Step 3: Implement the small pure model**

Create `jev-personalization.js` with the following implementation. Keep these exported names and the state shape stable for `app.js`.

```js
// JEV-OMNI의 방문 의도 점수와 화면 순서를 계산하는 순수 함수
const MODULES = ['cpu', 'gpu', 'neural'];
const HALF_LIFE_MS = 10 * 60 * 1000;
const DEFAULT_ORDER = ['catalog', 'knowledgeMapSection', 'compare'];

export function createJevIntentState(modulePreferences = {}, now = Date.now()) {
  const preferences = Object.fromEntries(MODULES.map(module => [module, Math.max(0, Number(modulePreferences[module]) || 0)]));
  const ranked = [...MODULES].sort((left, right) => preferences[right] - preferences[left]);
  const focusModule = preferences[ranked[0]] - preferences[ranked[1]] >= 2 ? ranked[0] : null;
  return { scores: Object.fromEntries(MODULES.map(module => [module, 0])), compareScore: 0, updatedAt: now, modulePreferences: preferences, focusModule };
}

export function recordJevSignal(state, signal, now = Date.now()) {
  const elapsed = Math.max(0, now - state.updatedAt);
  const decay = 0.5 ** (elapsed / HALF_LIFE_MS);
  const next = {
    scores: Object.fromEntries(MODULES.map(module => [module, state.scores[module] * decay])),
    updatedAt: now,
    compareScore: state.compareScore * decay,
    modulePreferences: { ...state.modulePreferences },
    focusModule: state.focusModule,
  };

  if (MODULES.includes(signal.module) && signal.type === 'module-focus') {
    next.scores[signal.module] += 3;
    next.modulePreferences[signal.module] += 1;
    next.focusModule = signal.module;
  } else if (MODULES.includes(signal.module) && signal.type === 'module-compare') {
    next.scores[signal.module] += 2;
    next.focusModule = signal.module;
  } else if (MODULES.includes(signal.module) && signal.type === 'module-dwell' && signal.durationMs >= 8000) {
    next.scores[signal.module] += 1;
    next.focusModule = signal.module;
  } else if (signal.type === 'comparison-changed' && signal.source === 'catalog') {
    const validPair = Array.isArray(signal.chipNames) && signal.chipNames.length === 2 && signal.chipNames.every(name => typeof name === 'string' && name.length > 0) && new Set(signal.chipNames).size === 2;
    next.compareScore = validPair ? 5 : 0;
  }

  return next;
}

export function getJevIntent(state) {
  const moduleScore = Math.max(...MODULES.map(module => state.scores[module]));
  if (state.compareScore >= 5 && state.compareScore >= moduleScore) return 'compare';
  return moduleScore >= 5 ? 'architecture' : 'explore';
}

export function getJevSectionOrder(intent) {
  if (intent === 'compare') return ['compare', 'catalog', 'knowledgeMapSection'];
  if (intent === 'architecture') return ['knowledgeMapSection', 'compare', 'catalog'];
  return [...DEFAULT_ORDER];
}

export function updateSelectedChips(selected, name) {
  if (selected.includes(name)) return selected.length > 1 ? selected.filter(chip => chip !== name) : [...selected];
  return selected.length < 2 ? [...selected, name] : [selected[1], name];
}
```

- [ ] **Step 4: Run the focused tests**

Run: `node --test test/jev-personalization.test.mjs`

Expected: all eight tests pass; score decay, comparison recovery, preference ties, and section ordering are deterministic under the supplied inputs.

- [ ] **Step 5: Commit the isolated model**

```powershell
git add -- jev-personalization.js test/jev-personalization.test.mjs
git commit -m "JEV 의도 점수 모델 추가"
```

## Task 2: Connect JEV profile, module controls, and personalization toggle

**Files:**
- Modify: `app.js`
- Modify: `index.html`
- Modify: `translations.js`
- Modify: `test/modules.test.mjs`
- Modify: `test/content.test.mjs`

- [ ] **Step 1: Add translation completeness checks**

Add the translation assertion to `test/modules.test.mjs`, which already imports `translations`. Add the HTML assertions to `test/content.test.mjs`, which already reads `index.html`. Run `npm test` and verify the new assertions fail before adding the keys and markup.

```js
const personalizationKeys = ['personalizationOn', 'personalizationOff', 'moduleFocus', 'personalizationChanged'];
assert.equal(Object.values(translations).every(copy => personalizationKeys.every(key => copy[key])), true);
assert.match(html, /id="personalizationToggle"/);
assert.match(html, /id="personalizationStatus" aria-live="polite"/);
```

- [ ] **Step 2: Add translated control and status labels**

Add these four keys to each language in `translations.js`. Keep the existing `profileNotice` and `clearProfile` strings unchanged. Re-run `npm test` and expect the translation completeness checks to pass.

| Key | English | Korean | Japanese | Chinese |
| --- | --- | --- | --- | --- |
| `personalizationOn` | `Personalized UI: On` | `맞춤 UI: 켜짐` | `パーソナライズ UI: オン` | `个性化界面：开` |
| `personalizationOff` | `Personalized UI: Off` | `맞춤 UI: 꺼짐` | `パーソナライズ UI: オフ` | `个性化界面：关` |
| `moduleFocus` | `Focus this module` | `이 모듈 강조` | `このモジュールを強調` | `突出此模块` |
| `personalizationChanged` | `Personalized view updated` | `맞춤 화면을 업데이트했습니다` | `パーソナライズ表示を更新しました` | `个性化视图已更新` |

- [ ] **Step 3: Add the visible personalization controls**

In `index.html`, add this control beside `#clearProfileButton`, and add the live region beside the existing `#profileStatus`. Keep the existing profile disclosure visible.

```html
<button id="personalizationToggle" type="button" aria-pressed="true">Personalized UI: On</button>
<span id="personalizationStatus" aria-live="polite"></span>
```

- [ ] **Step 4: Initialize the local state and connect direct module actions**

In `app.js`, import `createJevIntentState`, `getJevIntent`, and `recordJevSignal`. Initialize the state from `omniProfile.moduleInterest || {}` and derive the focus mode from the local setting key `jev-omni-personalization-enabled`; default to enabled when the key is absent. Add a local helper with this contract:

```js
function recordPersonalizationSignal(signal) {
  if (!trackingEnabled || !personalizationEnabled) return;
  personalizationState = recordJevSignal(personalizationState, signal);
  omniProfile.moduleInterest = personalizationState.modulePreferences;
  saveOmniProfile();
  applyPersonalizedFocus();
  queueAdaptiveLayout(getJevIntent(personalizationState));
}
```

Render CPU, GPU, and Neural knowledge-map rows as keyboard-operable buttons with `data-module="cpu|gpu|neural"` and `aria-pressed`; keep Memory and Media rows informational. In comparison results, make only CPU, GPU, and Neural module cells selectable. Bind module actions once by event delegation on stable `#mapDetail` and `#compareGrid` parents; map actions send `module-focus`, and comparison actions send `module-compare`. In `toggleChip()`, replace the current inline pair update with `selected = updateSelectedChips(selected, name)`, render the catalog, comparison, and map, then send `comparison-changed` with `{ source: 'catalog', chipNames: [...selected] }`; the helper validates that the pair has two different names. This treats the default M1/M2 pair as neutral until the visitor changes it. On app initialization and every language change, set the toggle text from `t(personalizationEnabled ? 'personalizationOn' : 'personalizationOff')` and its `aria-pressed` value from `personalizationEnabled`.

- [ ] **Step 5: Add pointer dwell as a weak, bounded signal**

Use delegated pointer events so rerendered map rows do not retain stale listeners. Ignore touch, nested pointer events, and hidden-tab dwell. Install this once in `app.js` after `recordPersonalizationSignal` is defined:

```js
const moduleDwellTimers = new Map();
document.addEventListener('pointerover', event => {
  if (!personalizationEnabled || !['mouse', 'pen'].includes(event.pointerType)) return;
  const button = event.target.closest('[data-module][aria-pressed]');
  if (!button || button.contains(event.relatedTarget)) return;
  const timer = window.setTimeout(() => {
    moduleDwellTimers.delete(button);
    if (document.visibilityState === 'visible' && button.isConnected) recordPersonalizationSignal({ type: 'module-dwell', module: button.dataset.module, durationMs: 8000 });
  }, 8000);
  moduleDwellTimers.set(button, timer);
});
document.addEventListener('pointerout', event => {
  const button = event.target.closest('[data-module][aria-pressed]');
  if (!button || button.contains(event.relatedTarget)) return;
  window.clearTimeout(moduleDwellTimers.get(button));
  moduleDwellTimers.delete(button);
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') {
    for (const timer of moduleDwellTimers.values()) window.clearTimeout(timer);
    moduleDwellTimers.clear();
  }
});
```

Touch and keyboard users use direct module selection instead of dwell.

- [ ] **Step 6: Implement toggle, reset, and legacy profile behavior**

The toggle persists enabled state in `jev-omni-personalization-enabled`. Turning it off writes `false` before setting `trackingEnabled = false`, stops new JEV/personalization signals, and restores the default order and module density. Turning it on writes `true`, sets `personalizationEnabled = true` and `trackingEnabled = true`, and resumes recording without discarding the local aggregate. If storage is blocked, the toggle still changes the current session and the existing safe storage helpers keep the page functional. The existing clear-profile action clears `moduleInterest` along with the other profile fields. Profiles that predate `moduleInterest` initialize it to zero preferences; old `visits` and `clicks` do not force the `Returning` visual mode.

- [ ] **Step 7: Verify controls and profile behavior**

Run: `npm test`

Expected: all existing tests and four-language control-key checks pass. Inspect that disabled personalization produces no new interest count and profile clearing restores a no-focus state.

- [ ] **Step 8: Commit profile and control integration**

```powershell
git add -- app.js index.html translations.js test/modules.test.mjs test/content.test.mjs
git commit -m "JEV 모듈 관심 신호와 맞춤 설정 연결"
```

## Task 3: Apply live module focus, adaptive detail, and section order

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `index.html`

- [ ] **Step 1: Add stable module identifiers to rendered data**

Map the existing block labels to stable module keys (`CPU CLUSTER` → `cpu`, `GPU ARRAY` → `gpu`, `NEURAL ENGINE` → `neural`, `UNIFIED MEMORY` → `memory`, `MEDIA ENGINE` → `media`) using this helper:

```js
const moduleKeyForLabel = label => label.startsWith('CPU') ? 'cpu' : label.startsWith('GPU') ? 'gpu' : label.startsWith('NEURAL') ? 'neural' : label.startsWith('UNIFIED') ? 'memory' : 'media';
```

Emit `data-module` on the generated journey modules, catalog modules, knowledge-map rows, and comparison modules. Add `aria-pressed` only to the interactive CPU/GPU/Neural controls. Do not infer new chip specifications from illustrative scores.

- [ ] **Step 2: Implement cross-view focus and two detail levels**

Add `applyPersonalizedFocus()` in `app.js`. It sets `document.body.dataset.focusModule` to the selected module or removes it, sets `data-detail-level="focused"` or `"summary"`, updates `aria-pressed` on every CPU/GPU/Neural control, and toggles `.personal-focus` / `.personal-compact` on existing `[data-module]` elements. Add an empty `#mapFocusDetail` node in the `#mapDetail` template and update it with only the existing block value and corresponding `metricNames` entries. CPU uses `CPU SINGLE` and `CPU MULTI`, GPU uses `GPU GRAPHICS`, and Neural uses `AI COMPUTE`. Label every index as illustrative. Reapply the focus state after each of `renderJourney()`, `renderCatalog()`, `renderCompare()`, and `renderKnowledgeMap()` so rerendered cards keep the user's current focus.

Update `renderCompare()` to handle one selected chip without reading `pair[1].name`: render the available chip name, show `t('selectTwo')` in `.compare-empty`, and return before building comparison columns. This supports clearing compare intent when the visitor removes one target.

- [ ] **Step 3: Add the matching visual states**

In `styles.css`, reset button chrome on interactive `.map-spec` and `.compare-module` buttons so they retain the current visual style. Use `.personal-focus` to emphasize the matching module consistently across views and `.personal-compact` to reduce non-focused module details in focused mode. Add readable padding and muted text color for `.compare-empty`. Preserve the existing default when neither focus class is present, keep the mobile grid readable, and use the existing reduced-motion media query to disable reorder animation.

- [ ] **Step 4: Reorder only the three content sections and their rail links**

Add `queueAdaptiveLayout(intent)` and `applyAdaptiveLayout(intent)` in `app.js`, using `getJevSectionOrder(intent)`. Move the existing `#catalog`, `#knowledgeMapSection`, and `#compare` nodes in `main#top` to match the returned order; leave `.dashboard-stage` at the top. Reorder matching `.section-rail-link` elements at the same time. Update the rail observer to map section IDs to links rather than depending on parallel fixed arrays, and observe `.dashboard-stage` for the `#top` rail item instead of the whole `main#top` container.

Before moving nodes, save the current visible section and its viewport offset. Defer reordering while scroll events are active or keyboard focus is inside a moved section; apply the latest queued intent after scrolling settles and focus leaves. After DOM movement, correct scroll offset by the difference in the saved section's viewport position. Do not replace or clone content nodes.

- [ ] **Step 5: Announce automatic changes accessibly**

Use `#personalizationStatus` with `aria-live="polite"` to announce the newly focused module or changed section order through translated strings. Do not announce repeated identical state. Ensure the toggle updates its translated label and `aria-pressed` value.

- [ ] **Step 6: Run the focused suite and inspect the layout**

Run: `npm test`

Expected: pure-model and translation tests pass. Then run `npm run dev` and check the rendered page:

1. Clear the local profile and reload. Confirm the Catalog → Knowledge Map → Compare order.
2. Select Neural in Knowledge Map. Confirm the Neural module highlights and its existing metrics expand without reloading.
3. Select CPU in the comparison panel after focusing CPU in the map. Confirm architecture intent moves Knowledge Map ahead of Catalog after keyboard focus leaves the moved content.
4. Change the catalog comparison pair. Confirm Compare becomes the first content section and appears first in the rail; remove a selected target and confirm the compare intent clears when the pair is incomplete.
5. Turn personalization off. Confirm default order and summary detail return, selection stops updating, and language changes retain the off label.
6. Repeat keyboard navigation and the sequence at a narrow viewport with reduced motion enabled. Confirm focus, scroll position, labels, and touch/keyboard module selection remain usable.

- [ ] **Step 7: Commit adaptive rendering**

```powershell
git add -- app.js index.html styles.css
git commit -m "JEV 의도에 따라 화면 강조와 순서 조정"
```

## Task 4: Complete regression checks and update project records

**Files:**
- Modify: `checklist.md`
- Modify: `context-notes.md`
- Test: `test/*.test.mjs`

- [ ] **Step 1: Run the complete automated suite**

Run: `npm test`

Expected: all test files pass, including damaged/blocked local storage regressions and new intent-model tests.

- [ ] **Step 2: Build the production site**

Run: `npm run build`

Expected: Vite exits successfully and emits the app with all chip assets, translations, and styles. Confirm no dependency was added.

- [ ] **Step 3: Run whitespace and status checks**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors. Only planned app, style, translation, tests, and record files are changed; leave the two pre-existing untracked SVGs untouched.

- [ ] **Step 4: Record completion and push**

Tick the JEV checklist and append the actual verification results to `context-notes.md`. Review staged paths, commit the final verification record, and run `git push origin master`. Do not force-push if the branch diverges; inspect and report the cause first.

## Spec Coverage Self-Review

- Recent explicit module focus, comparison intent, weak eight-second active-tab dwell, ten-minute half-life, and legacy profile handling are covered by Tasks 1–2.
- Cross-view CPU/GPU/Neural focus, compare/architecture/default ordering, focused detail, stable DOM and rail order, deferred reflow, focus/scroll preservation, and polite announcements are covered by Task 3.
- Four-language controls, opt-out, profile clearing, local-only behavior, broken/blocked storage, responsive layout, and reduced motion are covered by Tasks 2–4.
- Final test, build, diff, user-file preservation, and remote-push requirements are covered by Task 4.
