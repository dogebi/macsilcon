// localStorage JSON 값을 안전하게 읽는 브라우저 저장소 유틸리티
export function readStoredJson(storage, key, fallback) {
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
