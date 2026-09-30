// WebMCP 칩 도구의 등록 및 구조화 응답을 검사하는 최소 회귀 테스트
import assert from 'node:assert/strict';
import { chips } from '../data.js';
import { createMacChipTools, registerMacChipTools } from '../webmcp.js';

const tools = createMacChipTools(chips);
assert.deepEqual(tools.map(tool => tool.name), ['list_mac_chips', 'get_mac_chip_specs', 'compare_mac_chips']);

const specs = await tools[1].execute({ name: 'M3 Max' });
assert.equal(specs.chip.memoryBandwidth, '400 GB/s');

const comparison = await tools[2].execute({ left: 'M3 Max', right: 'M3 Ultra' });
assert.deepEqual(comparison.chips.map(chip => chip.memoryBandwidth), ['400 GB/s', '800 GB/s']);
assert.equal(comparison.illustrativeIndices['MEMORY BANDWIDTH INDEX']['M3 Max'], 195);
assert.equal(comparison.illustrativeIndices['MEMORY BANDWIDTH INDEX']['M3 Ultra'], 290);
assert.equal((await tools[2].execute({ left: 'M3 Max', right: 'M3 Max' })).ok, false);

const registered = [];
const names = await registerMacChipTools({ registerTool: async tool => registered.push(tool.name) }, chips);
assert.deepEqual(names, registered);
