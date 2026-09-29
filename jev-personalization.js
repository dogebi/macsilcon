// JEV 의 방문 의도 점수와 화면 순서를 계산하는 순수 함수
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
    const validPair = Array.isArray(signal.chipNames)
      && signal.chipNames.length === 2
      && signal.chipNames.every(name => typeof name === 'string' && name.length > 0)
      && new Set(signal.chipNames).size === 2;
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
