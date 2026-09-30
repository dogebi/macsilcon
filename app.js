// Apple Silicon 칩을 모듈 박스와 비교 패널로 렌더링하는 브라우저 코드
import { chips } from './data.js';
import { pageCopy, translations, variantNotes } from './translations.js';
import { getLocalStorage, readStoredJson, readStoredValue, removeStoredValue, writeStoredValue } from './storage.js';
import { createJevIntentState, getJevIntent, recordJevSignal, updateSelectedChips } from './jev-personalization.js';
import { registerMacChipTools } from './webmcp.js';
const metricNames = ['CPU SINGLE', 'CPU MULTI', 'GPU GRAPHICS', 'MEMORY BANDWIDTH', 'AI COMPUTE'];
const focusedMetricIndexes = { cpu: [0, 1], gpu: [2], neural: [4] };
const omniStorageKey = 'jev-omni-profile-v1';
const personalizationStorageKey = 'jev-omni-personalization-enabled';
const storage = getLocalStorage();
let personalizationEnabled = readStoredValue(storage, personalizationStorageKey, 'true') !== 'false';
let trackingEnabled = personalizationEnabled;
const defaultOmniProfile = () => ({ visits: 0, startedAt: Date.now(), dwellSeconds: 0, clicks: {}, models: {}, sources: {}, moduleInterest: {} });
const omniParams = new URLSearchParams(location.search);
const omniSource = omniParams.get('utm_source') || omniParams.get('ref') || (document.referrer ? new URL(document.referrer).hostname : 'direct');
const omniProfile = readStoredJson(storage, omniStorageKey, defaultOmniProfile());
omniProfile.moduleInterest ||= {};
let personalizationState = createJevIntentState(omniProfile.moduleInterest);
if (trackingEnabled) {
  omniProfile.visits += 1;
  omniProfile.sources[omniSource] = (omniProfile.sources[omniSource] || 0) + 1;
}
const saveOmniProfile = () => trackingEnabled && writeStoredValue(storage, omniStorageKey, JSON.stringify(omniProfile));
const omniSegment = () => !personalizationEnabled ? 'explorer' : (getJevIntent(personalizationState) === 'architecture' ? 'analyst' : (getJevIntent(personalizationState) === 'compare' ? 'catalog' : 'explorer'));
function applyOmniMode() { const segment = omniSegment(); if (trackingEnabled) document.body.dataset.omniSource = omniSource; else delete document.body.dataset.omniSource; document.body.className = document.body.className.replace(/\bomni-[\w-]+\b/g, '').trim(); document.body.classList.add(`omni-${segment}`); $('#omniMode').textContent = `OMNI / ${segment.toUpperCase()}`; }
function trackOmni(event, value = '') { if (!trackingEnabled) return; omniProfile.clicks[event] = (omniProfile.clicks[event] || 0) + 1; if (value) omniProfile.models[value] = (omniProfile.models[value] || 0) + 1; saveOmniProfile(); applyOmniMode(); }
function updateOmniDwell() { omniProfile.dwellSeconds = Math.round((Date.now() - omniProfile.startedAt) / 1000); saveOmniProfile(); }
window.addEventListener('beforeunload', updateOmniDwell);
setInterval(updateOmniDwell, 15000);
const supportedLanguages = Object.keys(translations);
const browserLanguage = [...(navigator.languages || []), navigator.language].find(value => supportedLanguages.includes(value?.split('-')[0]));
let language = readStoredValue(storage, 'silicon-atlas-language', '') || browserLanguage?.split('-')[0] || 'en';
const t = key => (key === 'variantNote' && variantNotes[language]) || pageCopy[language]?.[key] || translations[language][key] || pageCopy.en?.[key] || translations.en[key] || key;
const localizedNodes = { '.stage-copy h1': 'stageTitle', '.stage-copy p': 'stageCopy', '.stage-legend span:nth-child(1)': 'activeModule', '.stage-legend span:nth-child(2)': 'memoryMedia', '.stage-legend span:nth-child(3)': 'computePath', '#catalogTitle': 'catalogTitle', '#catalog .section-heading p': 'catalogCopy', '#catalog .variant-note': 'variantNote', '#knowledgeMapTitle': 'mapTitle', '#knowledgeMapSection .knowledge-map-head p': 'mapCopy', '#compare .compare-heading p': 'compareCopy', '.compare-footnote': 'compareFootnote', '#resetButton': 'resetView', '.map-orb small': 'averageIndex', '.top-button': 'top', '.hud span:nth-child(2)': 'process', '.hud span:nth-child(3)': 'generations', '.hud span:nth-child(4)': 'modules', '.hud span:nth-child(5)': 'status', '.footer span:nth-child(1)': 'footerLeft', '.footer span:nth-child(2)': 'footerRight' };
Object.entries(localizedNodes).forEach(([selector, key]) => { const node = document.querySelector(selector); if (node) { node.dataset.i18n = key; if (key === 'stageTitle' || key === 'catalogTitle' || key === 'mapTitle' || key === 'variantNote') node.dataset.i18nHtml = 'true'; } });
function applyLanguage() { document.documentElement.lang = language; document.title = `Silicon Atlas / ${t('knowledgeMap')}`; document.querySelectorAll('[data-i18n]').forEach(node => { if (node.dataset.i18nHtml) node.innerHTML = t(node.dataset.i18n); else if (node.querySelector('b')) node.firstChild.textContent = `${t(node.dataset.i18n)} `; else node.textContent = t(node.dataset.i18n); }); const toggle = $('#personalizationToggle'); toggle.textContent = t(personalizationEnabled ? 'personalizationOn' : 'personalizationOff'); toggle.setAttribute('aria-pressed', String(personalizationEnabled)); renderKnowledgeMap(); }
const generationImages = Object.fromEntries(Object.entries(import.meta.glob('./assets/chip-*.webp', { eager: true, import: 'default' })).map(([path, image]) => [path.split('/').at(-1).replace(/^chip-|\.webp$/g, ''), image]));
const generationChips = chips.map(chip => ({
  ...chip,
  image: generationImages[chip.name.replace(' Pro', 'p').replaceAll(' ', '').toLowerCase()],
}));
let selected = ['M1', 'M2'];
const $ = selector => document.querySelector(selector);
const chipByName = name => chips.find(chip => chip.name === name);

const moduleKeyForLabel = label => label.startsWith('CPU') ? 'cpu' : label.startsWith('GPU') ? 'gpu' : label.startsWith('NEURAL') ? 'neural' : label.startsWith('UNIFIED') ? 'memory' : 'media';
function moduleMarkup([label, value, score, tone], compact = false) { return `<div class="module ${tone} ${compact ? 'compact' : ''}" data-module="${moduleKeyForLabel(label)}"><span class="module-port"></span><div class="module-label">${label}</div><strong>${value}</strong><small>${score}% ILLUSTRATIVE INDEX</small><i style="--fill:${Math.min(Number(score) / 4, 100)}%"></i></div>`; }
function applyPersonalizedFocus() {
  const focusModule = personalizationEnabled ? personalizationState.focusModule : null;
  if (focusModule) document.body.dataset.focusModule = focusModule;
  else delete document.body.dataset.focusModule;
  document.body.dataset.detailLevel = focusModule ? 'focused' : 'summary';
  document.querySelectorAll('[data-module]').forEach(node => {
    const selectedModule = node.dataset.module === focusModule;
    node.classList.toggle('personal-focus', Boolean(focusModule && selectedModule));
    node.classList.toggle('personal-compact', Boolean(focusModule && !selectedModule));
    if (node.matches('button[data-module]')) node.setAttribute('aria-pressed', String(Boolean(focusModule && selectedModule)));
  });
  const detail = $('#mapFocusDetail');
  const chip = chipByName(mapChipActive || 'M1');
  if (detail && chip) detail.innerHTML = focusModule
    ? (focusedMetricIndexes[focusModule] || []).map(index => `<div><span>${metricNames[index]}</span><b>${chip.metrics[index]}</b><small>ILLUSTRATIVE INDEX</small></div>`).join('')
    : '';
}
function chipMarkup(chip, compact = false) { return `<div class="chip-shell ${compact ? 'compact-shell' : ''}"><div class="chip-shell-head"><b>${chip.name}</b><span>${chip.type}</span><em>${chip.year}</em></div><div class="chip-bus"></div><div class="module-grid">${chip.blocks.map(block => moduleMarkup(block, compact)).join('')}</div><div class="chip-shell-foot"><span>UNIFIED ARCHITECTURE</span><span>${chip.blocks.length} MODULES</span></div></div>`; }
function renderJourney() { $('#journeyTrack').innerHTML = generationChips.map((chip, index) => `<article class="generation-scene">${chip.image ? `<div class="scene-image-frame"><img src="${chip.image}" alt="${chip.name} 세대 인포그래픽" loading="${index === 0 ? 'eager' : 'lazy'}" fetchpriority="${index === 0 ? 'high' : 'low'}" decoding="async"></div>` : `<div class="scene-image-frame variant-art-frame"><div class="variant-art"><span>APPLE SILICON / MODEL</span><strong>${chip.name}</strong><small>${chip.type} / ${chip.year}</small><i></i></div></div>`}${chipMarkup(chip)}</article>`).join(''); applyPersonalizedFocus(); }
function renderCatalog() {
  const families = [...new Set(chips.map(chip => chip.name.split(' ')[0]))];
  $('#chipGrid').innerHTML = families.map(family => {
    const familyChips = chips.filter(chip => chip.name === family || chip.name.startsWith(`${family} `));
    return `<section class="model-branch" aria-labelledby="family-${family}"><div class="branch-root"><span class="branch-pulse"></span><strong id="family-${family}">${family}</strong><small>${familyChips.length} MODELS</small></div><div class="branch-line"></div><div class="branch-leaves">${familyChips.map(chip => { const active = selected.includes(chip.name); return `<button class="chip-card ${active ? 'selected' : ''}" data-chip="${chip.name}" type="button" aria-pressed="${active}"><span class="card-order">${active ? `0${selected.indexOf(chip.name) + 1}` : '+'}</span>${chipMarkup(chip, true)}<div class="card-meta"><strong>${chip.name}</strong><span>${chip.type} / ${chip.year}</span></div></button>`; }).join('')}</div></section>`;
  }).join('');
  document.querySelectorAll('.chip-card').forEach(card => card.addEventListener('click', () => { trackOmni('catalog', card.dataset.chip); toggleChip(card.dataset.chip); }));
  applyPersonalizedFocus();
}
function toggleChip(name) { trackOmni('compare', name); selected = updateSelectedChips(selected, name); renderCatalog(); renderCompare(); renderKnowledgeMap(); recordPersonalizationSignal({ type: 'comparison-changed', source: 'catalog', chipNames: [...selected] }); $('#compare').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
function renderCompare() {
  const pair = selected.map(chipByName);
  $('#leftName').textContent = pair[0]?.name || t('selectTwo');
  $('#rightName').textContent = pair[1]?.name || '';
  if (pair.length < 2) {
    $('#compareGrid').innerHTML = `<p class="compare-empty">${t('selectTwo')}</p>`;
    applyPersonalizedFocus();
    return;
  }
  $('#compareGrid').innerHTML = pair.map((chip, column) => `<article class="compare-column"><div class="compare-column-head"><span class="live-dot">●</span><div><h3>${chip.name}</h3><small>${chip.type} / ${chip.year}</small></div><b>${column === 0 ? 'TARGET A' : 'TARGET B'}</b></div><div class="compare-modules">${chip.blocks.map(([label, value, score, tone]) => {
    const module = moduleKeyForLabel(label);
    const control = ['cpu', 'gpu', 'neural'].includes(module);
    const tag = control ? 'button' : 'div';
    const actionLabel = control ? `${t('moduleCompare')}: ${t(module)}` : '';
    return `<${tag} ${control ? `type="button" aria-label="${actionLabel}" aria-pressed="${personalizationState.focusModule === module}"` : ''} class="compare-module ${tone}" data-module="${module}"><div><span>${label}</span><strong>${value}</strong></div><small>${score} / ILLUSTRATIVE INDEX</small><i><b style="width:${Math.min(Number(score) / 4, 100)}%"></b></i></${tag}>`;
  }).join('')}</div></article>`).join('');
  applyPersonalizedFocus();
}
let mapChipActive = 'M1';
function renderKnowledgeMap() {
  const chip = chipByName(mapChipActive) || chips[0];
  const average = Math.round(chip.metrics.reduce((sum, value) => sum + value, 0) / chip.metrics.length);
  $('#mapChipName').textContent = chip.name;
  $('#mapAverageIndex').textContent = average;
  const source = chip.sourceUrl ? `<a class="map-source" href="${chip.sourceUrl}" target="_blank" rel="noopener">${t('officialSpecs')}</a>` : '';
  const moduleKeys = ['cpu', 'gpu', 'neural', 'memory', 'media'];
  const focusModule = personalizationEnabled ? personalizationState.focusModule : null;
  $('#mapDetail').innerHTML = `<div class="map-detail-kicker">${t('activeSilicon')} / ${chip.year}</div><h3>${chip.name}</h3><strong>${chip.type}</strong><div class="map-spec-list">${chip.blocks.map(([label, value, score, tone], index) => { const module = moduleKeyForLabel(label); const control = ['cpu', 'gpu', 'neural'].includes(module); const tag = control ? 'button' : 'div'; return `<${tag} ${control ? `type="button" aria-label="${t('moduleFocus')}: ${t(moduleKeys[index])}" aria-pressed="${focusModule === module}"` : ''} class="map-spec ${tone}" data-module="${module}"><span>${t(moduleKeys[index])}</span><b>${value}</b><i><em style="width:${Math.min(Number(score) / 4, 100)}%"></em></i></${tag}>`; }).join('')}</div><div id="mapFocusDetail" class="map-focus-detail"></div>${source}`;
  $('#mapCards').innerHTML = chips.map((model, index) => { const active = model.name === chip.name; return `<button class="model-map-card ${active ? 'active' : ''}" data-map-chip="${model.name}" type="button" aria-pressed="${active}"><span class="map-card-index">${String(index + 1).padStart(2, '0')}</span><span class="map-card-label">${model.name.split(' ')[0]}</span><strong>${model.name}</strong><small>${model.type} · ${model.year}</small><i><b style="width:${Math.min(Number(model.metrics[0]) / 4, 100)}%"></b></i></button>`; }).join('');
  $('#mapWireGroup').innerHTML = chips.map((model, index) => { const column = index % 3; const row = Math.floor(index / 3); const endX = 760 + column * 145; const endY = 70 + row * 100; const active = model.name === chip.name; return `<path class="map-wire ${active ? 'active' : ''}" data-map-wire="${model.name}" d="M430 340 C540 340 ${endX - 150} ${endY} ${endX} ${endY}"></path>`; }).join('');
  document.querySelectorAll('.model-map-card').forEach(card => card.addEventListener('click', () => { trackOmni('map', card.dataset.mapChip); mapChipActive = card.dataset.mapChip; renderKnowledgeMap(); }));
  applyPersonalizedFocus();
}
function recordPersonalizationSignal(signal) {
  if (!trackingEnabled || !personalizationEnabled) return;
  const previousFocus = personalizationState.focusModule;
  const previousOrder = [...$('#top').children].filter(node => ['catalog', 'knowledgeMapSection', 'compare'].includes(node.id)).map(node => node.id).join(',');
  personalizationState = recordJevSignal(personalizationState, signal);
  omniProfile.moduleInterest = personalizationState.modulePreferences;
  saveOmniProfile();
  applyPersonalizedFocus();
  applyOmniMode();
  queueAdaptiveLayout(getJevIntent(personalizationState));
  const currentOrder = [...$('#top').children].filter(node => ['catalog', 'knowledgeMapSection', 'compare'].includes(node.id)).map(node => node.id).join(',');
  const announcements = [];
  if (personalizationState.focusModule !== previousFocus && personalizationState.focusModule) announcements.push(`${t('focusedModule')}: ${t(personalizationState.focusModule)}`);
  if (currentOrder !== previousOrder) announcements.push(t('sectionsUpdated'));
  const message = announcements.join('. ');
  if (message && $('#personalizationStatus').textContent !== message) $('#personalizationStatus').textContent = message;
}
let queuedAdaptiveIntent = null;
let adaptiveScrollTimer = 0;
let adaptiveScrollActive = false;
let keyboardNavigation = false;
function hasKeyboardFocusInMovableSection() {
  return keyboardNavigation && ['catalog', 'knowledgeMapSection', 'compare'].some(id => document.getElementById(id).contains(document.activeElement));
}
function flushAdaptiveLayout() {
  if (queuedAdaptiveIntent === null || adaptiveScrollActive || hasKeyboardFocusInMovableSection()) return;
  const intent = queuedAdaptiveIntent;
  queuedAdaptiveIntent = null;
  applyAdaptiveLayout(intent);
}
function queueAdaptiveLayout(intent) {
  queuedAdaptiveIntent = intent;
  flushAdaptiveLayout();
}
function applyAdaptiveLayout(intent) {
  const sectionOrder = getJevSectionOrder(personalizationEnabled ? intent : 'explore');
  const main = $('#top');
  const stage = main.querySelector('.dashboard-stage');
  const sections = new Map(['catalog', 'knowledgeMapSection', 'compare'].map(id => [id, document.getElementById(id)]));
  const currentOrder = [...main.children].filter(node => sections.has(node.id)).map(node => node.id);
  const changed = sectionOrder.some((id, index) => currentOrder[index] !== id);
  const orderedIds = ['top', ...sectionOrder];
  const currentRailOrder = [...railNav.querySelectorAll('.section-rail-link')].map(link => link.getAttribute('href').slice(1));
  const railChanged = orderedIds.some((id, index) => currentRailOrder[index] !== id);
  const anchors = [stage, ...sections.values()].map(node => ({ node, top: node.getBoundingClientRect().top, bottom: node.getBoundingClientRect().bottom })).filter(({ top, bottom }) => bottom > 0 && top < window.innerHeight).sort((left, right) => Math.abs(left.top) - Math.abs(right.top));
  const anchor = anchors[0];
  const activeElement = document.activeElement;
  const hadSectionFocus = [...sections.values()].some(section => section.contains(activeElement));

  if (changed) sectionOrder.forEach(id => main.append(sections.get(id)));
  if (railChanged) orderedIds.forEach((id, index) => {
    const link = railLinkById.get(id);
    if (!link) return;
    const number = link.querySelector('span');
    const label = String(index + 1).padStart(2, '0');
    if (number && number.textContent !== label) number.textContent = label;
    railNav.append(link);
  });

  if (!changed) return;
  if (hadSectionFocus && document.activeElement !== activeElement) activeElement.focus({ preventScroll: true });
  if (anchor) {
    const offset = anchor.node.getBoundingClientRect().top - anchor.top;
    if (Math.abs(offset) > 1) window.scrollBy(0, offset);
  }
  const status = $('#personalizationStatus');
  const message = t('sectionsUpdated');
  if (status.textContent !== message) status.textContent = message;
}
document.addEventListener('keydown', event => {
  if (['Tab', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) keyboardNavigation = true;
});
document.addEventListener('pointerdown', () => {
  keyboardNavigation = false;
  flushAdaptiveLayout();
});
document.addEventListener('focusout', () => queueMicrotask(flushAdaptiveLayout));
window.addEventListener('scroll', () => {
  adaptiveScrollActive = true;
  window.clearTimeout(adaptiveScrollTimer);
  adaptiveScrollTimer = window.setTimeout(() => { adaptiveScrollActive = false; flushAdaptiveLayout(); }, 180);
}, { passive: true });
$('#mapDetail').addEventListener('click', event => {
  const control = event.target.closest('button[data-module]');
  if (control) recordPersonalizationSignal({ type: 'module-focus', module: control.dataset.module });
});
$('#compareGrid').addEventListener('click', event => {
  const control = event.target.closest('button[data-module]');
  if (control) recordPersonalizationSignal({ type: 'module-compare', module: control.dataset.module });
});
const moduleDwellTimers = new Map();
document.addEventListener('pointerover', event => {
  if (!personalizationEnabled || !['mouse', 'pen'].includes(event.pointerType) || !(event.target instanceof Element)) return;
  const button = event.target.closest('button[data-module][aria-pressed]');
  if (!button || button.contains(event.relatedTarget)) return;
  const timer = window.setTimeout(() => {
    moduleDwellTimers.delete(button);
    if (document.visibilityState === 'visible' && button.isConnected) recordPersonalizationSignal({ type: 'module-dwell', module: button.dataset.module, durationMs: 8000 });
  }, 8000);
  moduleDwellTimers.set(button, timer);
});
document.addEventListener('pointerout', event => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest('button[data-module][aria-pressed]');
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
function registerWebMCP() {
  if (!document.modelContext?.registerTool) {
    window.macCompareWebMCP = { available: false, registered: [], error: 'WebMCP is unavailable in this browser context.' };
    return;
  }
  const controller = new AbortController();
  window.macCompareWebMCP = { available: true, registered: [], controller };
  registerMacChipTools(document.modelContext, chips, controller.signal)
    .then(registered => { window.macCompareWebMCP.registered = registered; })
    .catch(error => { window.macCompareWebMCP.error = String(error?.message || error); });
}
$('#resetButton').addEventListener('click', () => { selected = ['M1', 'M2']; personalizationState.compareScore = 0; renderCatalog(); renderCompare(); renderKnowledgeMap(); queueAdaptiveLayout(getJevIntent(personalizationState)); });
$('#personalizationToggle').addEventListener('click', () => {
  personalizationEnabled = !personalizationEnabled;
  writeStoredValue(storage, personalizationStorageKey, String(personalizationEnabled));
  trackingEnabled = personalizationEnabled;
  if (!personalizationEnabled) {
    for (const timer of moduleDwellTimers.values()) window.clearTimeout(timer);
    moduleDwellTimers.clear();
  }
  applyLanguage();
  applyPersonalizedFocus();
  applyOmniMode();
  queueAdaptiveLayout(getJevIntent(personalizationState));
  $('#personalizationStatus').textContent = t('personalizationChanged');
});
$('#clearProfileButton').addEventListener('click', () => { const removed = removeStoredValue(storage, omniStorageKey); trackingEnabled = false; personalizationEnabled = false; writeStoredValue(storage, personalizationStorageKey, 'false'); Object.assign(omniProfile, { visits: 0, startedAt: Date.now(), dwellSeconds: 0, clicks: {}, models: {}, sources: {}, moduleInterest: {} }); personalizationState = createJevIntentState(); applyLanguage(); applyPersonalizedFocus(); applyOmniMode(); queueAdaptiveLayout('explore'); $('#profileStatus').textContent = t(removed ? 'profileCleared' : 'profileClearUnavailable'); });
$('#topButton').addEventListener('click', () => $('#top').scrollIntoView({ behavior: 'smooth', block: 'start' }));
$('#languageSelect').value = language;
$('#languageSelect').addEventListener('change', event => { trackOmni('language', event.target.value); language = event.target.value; writeStoredValue(storage, 'silicon-atlas-language', language); applyLanguage(); });
const railNav = document.querySelector('.section-rail');
const railLinks = [...document.querySelectorAll('.section-rail-link')];
const railLinkById = new Map(railLinks.map(link => [link.getAttribute('href').slice(1), link]));
const railSectionByNode = new Map([
  [document.querySelector('.dashboard-stage'), railLinkById.get('top')],
  ...['catalog', 'knowledgeMapSection', 'compare'].map(id => [document.getElementById(id), railLinkById.get(id)]),
]);
railLinks.forEach(link => link.addEventListener('click', () => trackOmni('section', link.getAttribute('href'))));
const railObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) railLinks.forEach(link => link.classList.toggle('active', railSectionByNode.get(entry.target) === link)); }), { rootMargin: '-35% 0px -55% 0px' });
railSectionByNode.forEach((link, section) => railObserver.observe(section));
railNav.append(railLinkById.get('top'));
renderJourney(); renderCatalog(); renderCompare(); renderKnowledgeMap(); applyLanguage(); applyOmniMode(); saveOmniProfile(); registerWebMCP();
queueAdaptiveLayout(getJevIntent(personalizationState));
