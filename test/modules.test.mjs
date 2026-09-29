// 칩 데이터와 번역 모듈의 공개 API를 검사하는 회귀 테스트
import assert from 'node:assert/strict';
import { chips } from '../data.js';
import { translations, pageCopy, variantNotes } from '../translations.js';

assert.equal(chips.length, 19);
assert.equal(chips[0].name, 'M1');
const m6 = chips.find(chip => chip.name === 'M6');
assert.deepEqual(m6.blocks.map(([, value]) => value), ['12 CORE', '12 CORE', 'DUAL 16 CORE', '153 / 170 GB/s', 'AV1 / PRORES']);
assert.equal(m6.sourceUrl, 'https://support.apple.com/ko-kr/128108');
assert.equal(chips.some(chip => ['M6 Pro', 'M6 Max', 'M6 Ultra'].includes(chip.name)), false);
assert.deepEqual(Object.keys(translations).sort(), ['en', 'ja', 'ko', 'zh']);
assert.equal(Object.values(translations).every(value => value.referenceIndex.startsWith('ILLUSTRATIVE INDEX')), true);
assert.equal(Object.values(translations).every(value => ['averageIndex', 'profileNotice', 'clearProfile', 'profileCleared', 'profileClearUnavailable'].every(key => value[key])), true);
assert.equal(Object.values(translations).every(value => value.officialSpecs), true);
const personalizationKeys = ['personalizationOn', 'personalizationOff', 'moduleFocus', 'personalizationChanged'];
assert.equal(Object.values(translations).every(copy => personalizationKeys.every(key => copy[key])), true);
assert.equal(Object.keys(variantNotes).length, 4);
assert.ok(Object.values(variantNotes).every(note => note.includes('macrumors.com')));
assert.equal(pageCopy.ko.stageTitle.includes('칩'), true);
assert.equal(Object.values(pageCopy).every(copy => copy.mapTitle.includes('nineteen') || copy.mapTitle.includes('열아홉') || copy.mapTitle.includes('19') || copy.mapTitle.includes('十九')), true);
