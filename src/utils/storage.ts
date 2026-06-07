// ============================================================
// ClassPlus Organizer — Chrome Storage Helpers
// ============================================================

import type { Lecture, UserData } from '@/types/lecture';

const STORAGE_KEYS = {
  LECTURES: 'cp_organizer_lectures',
  USER_DATA: 'cp_organizer_user_data',
} as const;

const DEFAULT_USER_DATA: UserData = {
  bookmarks: [],
  statuses: {},
  tags: {},
  folders: [],
  recentlyOpened: [],
  customTags: [],
  totalCount: 0,
};

/**
 * Check if running in a Chrome extension context.
 */
function isChromeExtension(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

// ─── Chrome Storage API Wrappers ────────────────────────────

async function chromeGet<T>(key: string): Promise<T | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key] ?? null);
    });
  });
}

async function chromeSet(key: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve();
    });
  });
}

// ─── IndexedDB Fallback (for dev mode) ─────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ClassPlusOrganizer', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('data', 'readonly');
    const store = tx.objectStore('data');
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => resolve(null);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readwrite');
    const store = tx.objectStore('data');
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ─── Unified Storage Interface ─────────────────────────────

async function storageGet<T>(key: string): Promise<T | null> {
  if (isChromeExtension()) {
    return chromeGet<T>(key);
  }
  return idbGet<T>(key);
}

async function storageSet(key: string, value: unknown): Promise<void> {
  if (isChromeExtension()) {
    return chromeSet(key, value);
  }
  return idbSet(key, value);
}

// ─── Public API ────────────────────────────────────────────

/** Load all stored lectures. */
export async function loadLectures(): Promise<Lecture[]> {
  const data = await storageGet<Lecture[]>(STORAGE_KEYS.LECTURES);
  return data || [];
}

/** Save lectures (merges with existing). */
export async function saveLectures(lectures: Lecture[]): Promise<void> {
  await storageSet(STORAGE_KEYS.LECTURES, lectures);
}

/**
 * Merge incoming lectures with existing ones.
 * Deduplicates by `id`, keeping the newer version.
 */
export function mergeLectures(existing: Lecture[], incoming: Lecture[]): Lecture[] {
  const map = new Map<number, Lecture>();
  for (const lecture of existing) {
    map.set(lecture.id, lecture);
  }
  for (const lecture of incoming) {
    map.set(lecture.id, lecture); // Incoming overwrites existing
  }
  return Array.from(map.values());
}

/** Load user data (bookmarks, statuses, tags, folders, etc.). */
export async function loadUserData(): Promise<UserData> {
  const data = await storageGet<UserData>(STORAGE_KEYS.USER_DATA);
  return data || { ...DEFAULT_USER_DATA };
}

/** Save user data. */
export async function saveUserData(userData: UserData): Promise<void> {
  await storageSet(STORAGE_KEYS.USER_DATA, userData);
}

/** Export all data for backup. */
export async function exportAllData(): Promise<{ lectures: Lecture[]; userData: UserData }> {
  const [lectures, userData] = await Promise.all([
    loadLectures(),
    loadUserData(),
  ]);
  return { lectures, userData };
}

/** Import data from backup. */
export async function importAllData(data: { lectures: Lecture[]; userData: UserData }): Promise<void> {
  await Promise.all([
    saveLectures(data.lectures),
    saveUserData(data.userData),
  ]);
}

/** Get default user data. */
export function getDefaultUserData(): UserData {
  return { ...DEFAULT_USER_DATA };
}
