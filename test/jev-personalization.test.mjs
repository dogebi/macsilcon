// JEV 의 방문 의도 점수와 화면 순서를 계산하는 모델 테스트
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
