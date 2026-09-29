// Apple Silicon 칩을 모듈 박스와 비교 패널로 렌더링하는 브라우저 코드
import { chips } from './data.js';
import { pageCopy, translations } from './translations.js';
import { getLocalStorage, readStoredJson, readStoredValue, writeStoredValue } from './storage.js';
const metricNames = ['CPU SINGLE', 'CPU MULTI', 'GPU GRAPHICS', 'MEMORY BANDWIDTH', 'AI COMPUTE'];
const omniStorageKey = 'jev-omni-profile-v1';
const storage = getLocalStorage();
const defaultOmniProfile = () => ({ visits: 0, startedAt: Date.now(), dwellSeconds: 0, clicks: {}, models: {}, sources: {} });
const omniParams = new URLSearchParams(location.search);
const omniSource = omniParams.get('utm_source') || omniParams.get('ref') || (document.referrer ? new URL(document.referrer).hostname : 'direct');
const omniProfile = readStoredJson(storage, omniStorageKey, defaultOmniProfile());
omniProfile.visits += 1;
omniProfile.sources[omniSource] = (omniProfile.sources[omniSource] || 0) + 1;
const saveOmniProfile = () => writeStoredValue(storage, omniStorageKey, JSON.stringify(omniProfile));
const omniSegment = () => omniProfile.visits > 1 ? 'returning' : (omniProfile.clicks.map >= 2 ? 'analyst' : (omniProfile.clicks.catalog >= 2 ? 'catalog' : 'explorer'));
function applyOmniMode() { const segment = omniSegment(); document.body.dataset.omniSource = omniSource; document.body.className = document.body.className.replace(/\bomni-[\w-]+\b/g, '').trim(); document.body.classList.add(`omni-${segment}`); $('#omniMode').textContent = `OMNI / ${segment.toUpperCase()}`; }
function trackOmni(event, value = '') { omniProfile.clicks[event] = (omniProfile.clicks[event] || 0) + 1; if (value) omniProfile.models[value] = (omniProfile.models[value] || 0) + 1; saveOmniProfile(); applyOmniMode(); }
function updateOmniDwell() { omniProfile.dwellSeconds = Math.round((Date.now() - omniProfile.startedAt) / 1000); saveOmniProfile(); }
window.addEventListener('beforeunload', updateOmniDwell);
setInterval(updateOmniDwell, 15000);
const supportedLanguages = Object.keys(translations);
const browserLanguage = [...(navigator.languages || []), navigator.language].find(value => supportedLanguages.includes(value?.split('-')[0]));
let language = readStoredValue(storage, 'silicon-atlas-language', '') || browserLanguage?.split('-')[0] || 'en';
const t = key => pageCopy[language]?.[key] || translations[language][key] || pageCopy.en?.[key] || translations.en[key] || key;
const localizedNodes = { '.stage-copy h1': 'stageTitle', '.stage-copy p': 'stageCopy', '.stage-legend span:nth-child(1)': 'activeModule', '.stage-legend span:nth-child(2)': 'memoryMedia', '.stage-legend span:nth-child(3)': 'computePath', '#catalogTitle': 'catalogTitle', '#catalog .section-heading p': 'catalogCopy', '#knowledgeMapTitle': 'mapTitle', '#knowledgeMapSection .knowledge-map-head p': 'mapCopy', '#compare .compare-heading p': 'compareCopy', '.compare-footnote': 'compareFootnote', '#resetButton': 'resetView', '.map-orb small': 'averageIndex', '.top-button': 'top', '.hud span:nth-child(2)': 'process', '.hud span:nth-child(3)': 'generations', '.hud span:nth-child(4)': 'modules', '.hud span:nth-child(5)': 'status', '.footer span:nth-child(1)': 'footerLeft', '.footer span:nth-child(2)': 'footerRight' };
Object.entries(localizedNodes).forEach(([selector, key]) => { const node = document.querySelector(selector); if (node) { node.dataset.i18n = key; if (key === 'stageTitle' || key === 'catalogTitle' || key === 'mapTitle') node.dataset.i18nHtml = 'true'; } });
function applyLanguage() { document.documentElement.lang = language; document.title = `Silicon Atlas / ${t('knowledgeMap')}`; document.querySelectorAll('[data-i18n]').forEach(node => { if (node.dataset.i18nHtml) node.innerHTML = t(node.dataset.i18n); else if (node.querySelector('b')) node.firstChild.textContent = `${t(node.dataset.i18n)} `; else node.textContent = t(node.dataset.i18n); }); renderKnowledgeMap(); }
const generationImages = Object.fromEntries(Object.entries(import.meta.glob('./assets/chip-*.webp', { eager: true, import: 'default' })).map(([path, image]) => [path.split('/').at(-1).replace(/^chip-|\.webp$/g, ''), image]));
const generationChips = chips.map(chip => ({
  ...chip,
  image: generationImages[chip.name.replace(' Pro', 'p').replaceAll(' ', '').toLowerCase()],
}));
let selected = ['M1', 'M2'];
const $ = selector => document.querySelector(selector);
const chipByName = name => chips.find(chip => chip.name === name);

function moduleMarkup([label, value, score, tone], compact = false) { return `<div class="module ${tone} ${compact ? 'compact' : ''}"><span class="module-port"></span><div class="module-label">${label}</div><strong>${value}</strong><small>${score}% ILLUSTRATIVE INDEX</small><i style="--fill:${Math.min(Number(score) / 4, 100)}%"></i></div>`; }
function chipMarkup(chip, compact = false) { return `<div class="chip-shell ${compact ? 'compact-shell' : ''}"><div class="chip-shell-head"><b>${chip.name}</b><span>${chip.type}</span><em>${chip.year}</em></div><div class="chip-bus"></div><div class="module-grid">${chip.blocks.map(block => moduleMarkup(block, compact)).join('')}</div><div class="chip-shell-foot"><span>UNIFIED ARCHITECTURE</span><span>${chip.blocks.length} MODULES</span></div></div>`; }
function renderJourney() { $('#journeyTrack').innerHTML = generationChips.map((chip, index) => `<article class="generation-scene">${chip.image ? `<div class="scene-image-frame"><img src="${chip.image}" alt="${chip.name} 세대 인포그래픽" loading="${index === 0 ? 'eager' : 'lazy'}" fetchpriority="${index === 0 ? 'high' : 'low'}" decoding="async"></div>` : `<div class="scene-image-frame variant-art-frame"><div class="variant-art"><span>APPLE SILICON / MODEL</span><strong>${chip.name}</strong><small>${chip.type} / ${chip.year}</small><i></i></div></div>`}${chipMarkup(chip)}</article>`).join(''); }
function renderCatalog() {
  const families = [...new Set(chips.map(chip => chip.name.split(' ')[0]))];
  $('#chipGrid').innerHTML = families.map(family => {
    const familyChips = chips.filter(chip => chip.name === family || chip.name.startsWith(`${family} `));
    return `<section class="model-branch" aria-labelledby="family-${family}"><div class="branch-root"><span class="branch-pulse"></span><strong id="family-${family}">${family}</strong><small>${familyChips.length} MODELS</small></div><div class="branch-line"></div><div class="branch-leaves">${familyChips.map(chip => { const active = selected.includes(chip.name); return `<button class="chip-card ${active ? 'selected' : ''}" data-chip="${chip.name}" type="button" aria-pressed="${active}"><span class="card-order">${active ? `0${selected.indexOf(chip.name) + 1}` : '+'}</span>${chipMarkup(chip, true)}<div class="card-meta"><strong>${chip.name}</strong><span>${chip.type} / ${chip.year}</span></div></button>`; }).join('')}</div></section>`;
  }).join('');
  document.querySelectorAll('.chip-card').forEach(card => card.addEventListener('click', () => { trackOmni('catalog', card.dataset.chip); toggleChip(card.dataset.chip); }));
}
function toggleChip(name) { trackOmni('compare', name); if (selected.includes(name)) { if (selected.length > 1) selected = selected.filter(item => item !== name); } else selected = [selected[1], name]; renderCatalog(); renderCompare(); renderKnowledgeMap(); $('#compare').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
function renderCompare() { const pair = selected.map(chipByName); $('#leftName').textContent = pair[0].name; $('#rightName').textContent = pair[1].name; $('#compareGrid').innerHTML = pair.map((chip, column) => `<article class="compare-column"><div class="compare-column-head"><span class="live-dot">●</span><div><h3>${chip.name}</h3><small>${chip.type} / ${chip.year}</small></div><b>${column === 0 ? 'TARGET A' : 'TARGET B'}</b></div><div class="compare-modules">${chip.blocks.map(([label, value, score, tone]) => `<div class="compare-module ${tone}"><div><span>${label}</span><strong>${value}</strong></div><small>${score} / ILLUSTRATIVE INDEX</small><i><b style="width:${Math.min(Number(score) / 4, 100)}%"></b></i></div>`).join('')}</div></article>`).join(''); }
let mapChipActive = 'M1';
function renderKnowledgeMap() {
  const chip = chipByName(mapChipActive) || chips[0];
  const average = Math.round(chip.metrics.reduce((sum, value) => sum + value, 0) / chip.metrics.length);
  $('#mapChipName').textContent = chip.name;
  $('#mapAverageIndex').textContent = average;
  const moduleKeys = ['cpu', 'gpu', 'neural', 'memory', 'media'];
  $('#mapDetail').innerHTML = `<div class="map-detail-kicker">${t('activeSilicon')} / ${chip.year}</div><h3>${chip.name}</h3><strong>${chip.type}</strong><div class="map-spec-list">${chip.blocks.map(([label, value, score, tone], index) => `<div class="map-spec ${tone}"><span>${t(moduleKeys[index])}</span><b>${value}</b><i><em style="width:${Math.min(Number(score) / 4, 100)}%"></em></i></div>`).join('')}</div>`;
  $('#mapCards').innerHTML = chips.map((model, index) => { const active = model.name === chip.name; return `<button class="model-map-card ${active ? 'active' : ''}" data-map-chip="${model.name}" type="button" aria-pressed="${active}"><span class="map-card-index">${String(index + 1).padStart(2, '0')}</span><span class="map-card-label">${model.name.split(' ')[0]}</span><strong>${model.name}</strong><small>${model.type} · ${model.year}</small><i><b style="width:${Math.min(Number(model.metrics[0]) / 4, 100)}%"></b></i></button>`; }).join('');
  $('#mapWireGroup').innerHTML = chips.map((model, index) => { const column = index % 3; const row = Math.floor(index / 3); const endX = 760 + column * 145; const endY = 70 + row * 100; const active = model.name === chip.name; return `<path class="map-wire ${active ? 'active' : ''}" data-map-wire="${model.name}" d="M430 340 C540 340 ${endX - 150} ${endY} ${endX} ${endY}"></path>`; }).join('');
  document.querySelectorAll('.model-map-card').forEach(card => card.addEventListener('click', () => { trackOmni('map', card.dataset.mapChip); mapChipActive = card.dataset.mapChip; renderKnowledgeMap(); }));
}
function registerWebMCP() { if (!document.modelContext?.registerTool) return; const controller = new AbortController(); window.macCompareWebMCP = { controller }; const register = async () => { await document.modelContext.registerTool({ name: 'list_mac_chips', description: 'List the Mac chip modules available in the Silicon Atlas dashboard.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: async () => ({ chips: chips.map(chip => ({ name: chip.name, type: chip.type, year: chip.year, modules: chip.blocks.map(block => block[0]) })) }) }, { signal: controller.signal }); await document.modelContext.registerTool({ name: 'compare_mac_chips', description: 'Select two chips and return their decomposed module comparison.', inputSchema: { type: 'object', properties: { left: { type: 'string' }, right: { type: 'string' } }, required: ['left', 'right'], additionalProperties: false }, annotations: { readOnlyHint: true }, execute: async input => { const left = chipByName(input.left); const right = chipByName(input.right); if (!left || !right || left.name === right.name) return { ok: false, error: 'Choose two different chip names from list_mac_chips.' }; selected = [left.name, right.name]; renderCatalog(); renderCompare(); renderKnowledgeMap(); return { ok: true, selected, metrics: metricNames.map((metric, index) => ({ metric, left: left.metrics[index], right: right.metrics[index] })) }; } }, { signal: controller.signal }); }; register().catch(error => { window.macCompareWebMCP.error = String(error?.message || error); }); }
$('#resetButton').addEventListener('click', () => { selected = ['M1', 'M2']; renderCatalog(); renderCompare(); renderKnowledgeMap(); });
$('#topButton').addEventListener('click', () => $('#top').scrollIntoView({ behavior: 'smooth', block: 'start' }));
$('#languageSelect').value = language;
$('#languageSelect').addEventListener('change', event => { trackOmni('language', event.target.value); language = event.target.value; writeStoredValue(storage, 'silicon-atlas-language', language); applyLanguage(); });
const railSections = ['top', 'catalog', 'knowledgeMapSection', 'compare'].map(id => document.getElementById(id));
const railLinks = [...document.querySelectorAll('.section-rail-link')];
railLinks.forEach(link => link.addEventListener('click', () => trackOmni('section', link.getAttribute('href'))));
const railObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) railLinks.forEach((link, index) => link.classList.toggle('active', railSections[index] === entry.target)); }), { rootMargin: '-35% 0px -55% 0px' });
railSections.forEach(section => railObserver.observe(section));
renderJourney(); renderCatalog(); renderCompare(); renderKnowledgeMap(); applyLanguage(); applyOmniMode(); saveOmniProfile(); registerWebMCP();
