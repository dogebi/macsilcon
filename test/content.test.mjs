// HTML과 번역 문자열의 인코딩 손상을 검사하는 최소 회귀 테스트
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chips } from '../data.js';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const mojibake = /鈼\?|鏃|涓|靹|鞚|韯|甑/;

assert.equal(mojibake.test(html), false, 'index.html contains mojibake');
assert.equal(mojibake.test(app), false, 'app.js contains mojibake');
assert.doesNotMatch(app, /Object\.assign\(pageCopy\./, 'app.js contains duplicate escaped translations');
assert.match(app, /ILLUSTRATIVE INDEX/);
assert.doesNotMatch(app, /\?inline/);
assert.match(app, /const generationChips = chips\.map/);
assert.match(app, /import\.meta\.glob\('\.\/assets\/chip-\*\.webp'/);
assert.match(app, /loading="\$\{index === 0 \? 'eager' : 'lazy'\}"/);
assert.match(app, /chip\.name\.replace\(' Pro', 'p'\)\.replaceAll\(' ', ''\)\.toLowerCase\(\)/);
assert.ok(['M1 Pro', 'M1 Max', 'M2 Pro', 'M2 Max'].every(name => chips.some(chip => chip.name === name)));
assert.match(html, /한국어/);
assert.match(html, /日本語/);
assert.match(html, /中文/);
