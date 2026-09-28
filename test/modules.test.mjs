// 칩 데이터와 번역 모듈의 공개 API를 검사하는 회귀 테스트
import assert from 'node:assert/strict';
import { chips } from '../data.js';
import { translations, pageCopy } from '../translations.js';

assert.equal(chips.length, 18);
assert.equal(chips[0].name, 'M1');
assert.deepEqual(Object.keys(translations).sort(), ['en', 'ja', 'ko', 'zh']);
assert.equal(Object.values(translations).every(value => value.referenceIndex.startsWith('ILLUSTRATIVE INDEX')), true);
assert.equal(pageCopy.ko.stageTitle.includes('칩'), true);
