// localStorage 손상 데이터의 기본값 복구를 검사하는 회귀 테스트
import assert from 'node:assert/strict';
import { getLocalStorage, readStoredJson, readStoredValue, removeStoredValue, writeStoredValue } from '../storage.js';

const fallback = { visits: 0 };
const storage = {
  getItem() {
    return '{broken';
  },
};

assert.deepEqual(readStoredJson(storage, 'profile', fallback), fallback);
assert.equal(readStoredValue(storage, 'language', 'en'), '{broken');
const deniedStorage = {
  getItem() { throw new Error('storage disabled'); },
  setItem() { throw new Error('storage disabled'); },
  removeItem() { throw new Error('storage disabled'); },
};
assert.equal(readStoredValue(deniedStorage, 'language', 'en'), 'en');
assert.equal(writeStoredValue(deniedStorage, 'profile', '{}'), false);
assert.equal(removeStoredValue(deniedStorage, 'profile'), false);
assert.equal(removeStoredValue({ removeItem() {} }, 'profile'), true);
assert.doesNotThrow(() => getLocalStorage());
