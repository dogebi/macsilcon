// localStorage 손상 데이터의 기본값 복구를 검사하는 회귀 테스트
import assert from 'node:assert/strict';
import { readStoredJson } from '../storage.js';

const fallback = { visits: 0 };
const storage = {
  getItem() {
    return '{broken';
  },
};

assert.deepEqual(readStoredJson(storage, 'profile', fallback), fallback);
