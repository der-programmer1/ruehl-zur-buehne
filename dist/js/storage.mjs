export const STORAGE_KEY = 'ruehl-zur-buehne:v1';
export function readPreferences(storage) {
  const fallback = { sound: false, bestScore: 0, bestTime: 0 };
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!value || typeof value !== 'object') return fallback;
    return {
      sound: value.sound === true,
      bestScore: Number.isSafeInteger(value.bestScore) && value.bestScore > 0 ? value.bestScore : 0,
      bestTime: Number.isFinite(value.bestTime) && value.bestTime > 0 ? value.bestTime : 0
    };
  } catch { return fallback; }
}
export function writePreferences(storage, preferences) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(preferences)); return true; } catch { return false; }
}
