// localStorage JSON 값을 안전하게 읽는 브라우저 저장소 유틸리티
export function getLocalStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function readStoredValue(storage, key, fallback) {
  try {
    const value = storage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function readStoredJson(storage, key, fallback) {
  try {
    const value = readStoredValue(storage, key, null);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredValue(storage, key, value) {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
