// ============================================================
// ClassPlus Organizer — Background Service Worker
// ============================================================
// Handles message routing, lecture storage, and extension icon clicks.

import { parseLectures } from '@/utils/parser';
import { loadLectures, saveLectures, mergeLectures, loadUserData, saveUserData } from '@/utils/storage';
import type { RawLecture, UserData } from '@/types/lecture';

// ─── Message Handlers ──────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'LECTURES_RECEIVED') {
    handleLecturesReceived(message.payload)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true; // Keep message channel open for async response
  }

  if (message.type === 'GET_LECTURES') {
    loadLectures()
      .then((lectures) => sendResponse({ success: true, data: lectures }))
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true;
  }

  if (message.type === 'GET_USER_DATA') {
    loadUserData()
      .then((userData) => sendResponse({ success: true, data: userData }))
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true;
  }

  if (message.type === 'SAVE_USER_DATA') {
    saveUserData(message.payload as UserData)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true;
  }

  if (message.type === 'SAVE_LECTURES') {
    saveLectures(message.payload)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true;
  }
});

/**
 * Process intercepted lecture data from the content script.
 * Parses raw lectures, merges with existing data, and persists.
 */
async function handleLecturesReceived(payload: {
  lectures: RawLecture[];
  totalCount: number;
  courseId: string;
}): Promise<{ count: number; total: number }> {
  const { lectures: rawLectures, totalCount, courseId } = payload;

  // Parse raw lectures into normalized format
  const parsed = parseLectures(rawLectures, courseId);

  // Load existing lectures and merge
  const existing = await loadLectures();
  const merged = mergeLectures(existing, parsed);

  // Save merged lectures
  await saveLectures(merged);

  // Update total count in user data
  const userData = await loadUserData();
  if (totalCount > userData.totalCount) {
    userData.totalCount = totalCount;
    await saveUserData(userData);
  }

  console.log(
    `[ClassPlus Organizer] Stored ${parsed.length} lectures. Total: ${merged.length}/${totalCount}`
  );

  return { count: merged.length, total: totalCount };
}

// ─── Extension Icon Click → Toggle Sidebar ─────────────────

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' });
  }
});

// ─── Install / Update Handler ──────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[ClassPlus Organizer] Extension installed!');
  } else if (details.reason === 'update') {
    console.log(`[ClassPlus Organizer] Updated to v${chrome.runtime.getManifest().version}`);
  }
});
