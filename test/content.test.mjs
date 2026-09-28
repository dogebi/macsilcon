// HTML과 번역 문자열의 인코딩 손상을 검사하는 최소 회귀 테스트
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const mojibake = /鈼\?|鏃|涓|靹|鞚|韯|甑/;

assert.equal(mojibake.test(html), false, 'index.html contains mojibake');
assert.equal(mojibake.test(app), false, 'app.js contains mojibake');
assert.doesNotMatch(app, /Object\.assign\(pageCopy\./, 'app.js contains duplicate escaped translations');
assert.match(app, /ILLUSTRATIVE INDEX/);
assert.doesNotMatch(app, /\?inline/);
assert.match(html, /한국어/);
assert.match(html, /日本語/);
assert.match(html, /中文/);
