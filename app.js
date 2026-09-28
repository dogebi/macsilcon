// 칩 카탈로그, 스크롤 장면, 비교 상태와 WebMCP 도구를 관리하는 브라우저 코드
const chips = [
  ['M1', '기본형', 2020, 'M1_clean.webp', [100, 100, 100, 100, 100]],
  ['M1 Pro', '프로 워크플로', 2021, 'M1p_clean.webp', [125, 135, 140, 130, 120]],
  ['M1 Max', '크리에이터', 2021, 'M1max_clean.webp', [130, 180, 190, 150, 150]],
  ['M1 Ultra', '스튜디오급', 2022, 'M1ULTRA_clean.webp', [135, 260, 300, 220, 240]],
  ['M2', '기본형', 2022, 'm2_clean.webp', [115, 115, 120, 110, 115]],
  ['M2 Pro', '프로 워크플로', 2023, 'M2p_clean.webp', [145, 160, 165, 145, 140]],
  ['M2 Max', '크리에이터', 2023, 'M2max_clean.webp', [150, 210, 225, 170, 180]],
  ['M2 Ultra', '스튜디오급', 2023, 'M2ULTRA_clean.webp', [155, 300, 345, 250, 280]],
  ['M3', '기본형', 2023, 'm3_clean.webp', [135, 135, 145, 130, 145]],
  ['M3 Pro', '프로 워크플로', 2023, 'M3p_clean.webp', [160, 180, 195, 160, 170]],
  ['M3 Max', '크리에이터', 2023, 'M3max_clean.webp', [170, 240, 270, 195, 220]],
  ['M3 Ultra', '스튜디오급', 2025, 'M3ULTRA_clean.webp', [180, 340, 400, 290, 340]],
  ['M4', '기본형', 2024, 'm4_clean.webp', [155, 155, 170, 150, 180]],
  ['M4 Pro', '프로 워크플로', 2024, 'M4p_clean.webp', [185, 215, 235, 190, 220]],
  ['M4 Max', '크리에이터', 2024, 'M4max_clean.webp', [195, 285, 325, 235, 285]],
  ['M5', '현재 세대', 2025, 'M5_clean.webp', [175, 175, 195, 170, 210]],
  ['M5 Pro', '프로 워크플로', 2025, 'M5p_clean.webp', [210, 245, 275, 215, 255]],
  ['M5 Max', '크리에이터', 2025, 'M5max_clean.webp', [225, 320, 365, 265, 330]],
];
const metricNames = ['CPU 싱글', 'CPU 멀티', 'GPU 그래픽', '메모리 대역폭', 'AI 연산'];
const generationChips = ['M1', 'M2', 'M3', 'M4', 'M5'].map(name => chips.find(chip => chip[0] === name));
let selected = [chips[0][0], chips[4][0]];

const $ = selector => document.querySelector(selector);
const chipByName = name => chips.find(chip => chip[0] === name);
const imagePath = chip => `${import.meta.env.BASE_URL}assets/${chip[3]}`;

function renderJourney() {
  $('#journeyTrack').innerHTML = generationChips.map((chip, index) => `
    <article class="journey-scene" data-index="${index}">
      <img src="${imagePath(chip)}" alt="${chip[0]} 칩 이미지" loading="${index ? 'lazy' : 'eager'}">
      <span class="scene-number">0${index + 1}</span>
    </article>`).join('');
}

function renderCatalog() {
  $('#chipGrid').innerHTML = chips.map(chip => {
    const isSelected = selected.includes(chip[0]);
    return `<button class="chip-card ${isSelected ? 'selected' : ''}" data-chip="${chip[0]}" type="button" aria-pressed="${isSelected}">
      <span class="order">${isSelected ? `0${selected.indexOf(chip[0]) + 1}` : '＋'}</span>
      <img src="${imagePath(chip)}" alt="${chip[0]} 칩 이미지" loading="lazy"><strong>${chip[0]}</strong><small>${chip[1]} · ${chip[2]}</small>
    </button>`;
  }).join('');
  document.querySelectorAll('.chip-card').forEach(card => card.addEventListener('click', () => toggleChip(card.dataset.chip)));
}

function toggleChip(name) {
  if (selected.includes(name)) { if (selected.length > 1) selected = selected.filter(chip => chip !== name); }
  else { selected = [selected[1], name]; }
  renderCatalog(); renderCompare();
  $('#compare').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderCompare() {
  const pair = selected.map(chipByName);
  $('#leftName').textContent = pair[0][0]; $('#rightName').textContent = pair[1][0];
  $('#compareGrid').innerHTML = pair.map((chip, columnIndex) => `<article class="compare-column ${chip[4].reduce((a,b) => a+b, 0) >= pair[1 - columnIndex][4].reduce((a,b) => a+b, 0) ? 'winner' : ''}">
    <h3>${chip[0]}</h3><div class="chip-type">${chip[1]} · ${chip[2]}</div>${chip[4].map((value, index) => `<div class="metric"><div class="metric-label"><span>${metricNames[index]}</span><strong>${value}</strong></div><div class="meter"><span style="width:${Math.min(value / 4, 100)}%"></span></div></div>`).join('')}
  </article>`).join('');
}

function updateJourney() {
  const section = $('.journey');
  const range = section.offsetHeight - window.innerHeight;
  const progress = Math.max(0, Math.min(1, (window.scrollY - section.offsetTop) / range));
  const position = progress * (generationChips.length - 1);
  document.querySelectorAll('.journey-scene').forEach((scene, index) => {
    const distance = index - position;
    scene.style.opacity = String(Math.max(0, 1 - Math.abs(distance) * 1.65));
    scene.style.transform = `translate3d(${distance * 42}vw, ${Math.abs(distance) * 12}vh, 0) scale(${1 - Math.min(Math.abs(distance) * .16, .28)}) rotate(${distance * 3}deg)`;
  });
  const active = Math.round(position);
  $('#generationLabel').textContent = generationChips[active][0]; $('#generationCount').textContent = `0${active + 1} / 05`;
  $('#journeyProgress').style.transform = `scaleY(${progress})`;
}

function registerWebMCP() {
  if (!document.modelContext?.registerTool) return;
  const controller = new AbortController();
  window.macCompareWebMCP = { controller };
  const register = async () => {
    await document.modelContext.registerTool({ name: 'list_mac_chips', description: 'List the Mac chip families available in the comparison catalog.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: async () => ({ chips: chips.map(chip => ({ name: chip[0], type: chip[1], year: chip[2] })) }) }, { signal: controller.signal });
    await document.modelContext.registerTool({ name: 'compare_mac_chips', description: 'Select two Mac chips and return their comparison reference metrics. The selection is also reflected in the page.', inputSchema: { type: 'object', properties: { left: { type: 'string', description: 'First chip name, for example M1.' }, right: { type: 'string', description: 'Second chip name, for example M2.' } }, required: ['left', 'right'], additionalProperties: false }, annotations: { readOnlyHint: true }, execute: async input => { const left = chipByName(input.left); const right = chipByName(input.right); if (!left || !right || left[0] === right[0]) return { ok: false, error: 'Choose two different chip names from list_mac_chips.' }; selected = [left[0], right[0]]; renderCatalog(); renderCompare(); return { ok: true, selected: selected.slice(), metrics: metricNames.map((metric, index) => ({ metric, left: left[4][index], right: right[4][index] })) }; } }, { signal: controller.signal });
  };
  register().catch(error => { window.macCompareWebMCP.error = String(error?.message || error); });
}

$('#resetButton').addEventListener('click', () => { selected = [chips[0][0], chips[4][0]]; renderCatalog(); renderCompare(); });
renderJourney(); renderCatalog(); renderCompare(); registerWebMCP();
window.addEventListener('scroll', updateJourney, { passive: true }); window.addEventListener('resize', updateJourney); updateJourney();
