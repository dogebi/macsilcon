// Apple Silicon 칩 사양을 WebMCP 도구로 노출하는 모듈
const specFor = chip => ({
  name: chip.name,
  type: chip.type,
  year: chip.year,
  specs: chip.blocks.map(([name, value]) => ({ name, value })),
  memoryBandwidth: chip.blocks.find(([name]) => name === 'UNIFIED MEMORY')?.[1] || null,
  sourceUrl: chip.sourceUrl || null,
});

export function createMacChipTools(chips) {
  const chipByName = name => chips.find(chip => chip.name === name);
  return [
    {
      name: 'list_mac_chips',
      description: 'List the Mac chip models available in Silicon Atlas.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async () => ({ chips: chips.map(({ name, type, year }) => ({ name, type, year })) }),
    },
    {
      name: 'get_mac_chip_specs',
      description: 'Get a Mac chip model’s displayed specifications, including its memory bandwidth.',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string', description: 'Exact model name, for example M3 Max.' } },
        required: ['name'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async ({ name }) => {
        const chip = chipByName(name);
        return chip ? { ok: true, chip: specFor(chip) } : { ok: false, error: `Unknown chip: ${name}` };
      },
    },
    {
      name: 'compare_mac_chips',
      description: 'Compare two Mac chip models, including their displayed memory bandwidths and illustrative indices.',
      inputSchema: {
        type: 'object',
        properties: {
          left: { type: 'string', description: 'Exact first model name, for example M3 Max.' },
          right: { type: 'string', description: 'Exact second model name, for example M3 Ultra.' },
        },
        required: ['left', 'right'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async ({ left: leftName, right: rightName }) => {
        const left = chipByName(leftName);
        const right = chipByName(rightName);
        if (!left || !right || left === right) return { ok: false, error: 'Choose two different chip names from list_mac_chips.' };
        return {
          ok: true,
          chips: [left, right].map(specFor),
          illustrativeIndices: Object.fromEntries(metricNames.map((metric, index) => [`${metric} INDEX`, { [left.name]: left.metrics[index], [right.name]: right.metrics[index] }])),
        };
      },
    },
  ];
}

const metricNames = ['CPU SINGLE', 'CPU MULTI', 'GPU GRAPHICS', 'MEMORY BANDWIDTH', 'AI COMPUTE'];

export async function registerMacChipTools(modelContext, chips, signal) {
  const tools = createMacChipTools(chips);
  await Promise.all(tools.map(tool => modelContext.registerTool(tool, { signal })));
  return tools.map(({ name }) => name);
}
