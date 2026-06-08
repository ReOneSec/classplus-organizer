// content.js — ClassPlus Organizer
// Runs inside web.classplusapp.com — handles entity detection and pending lecture clicks

(function () {
  'use strict';

  // ── Entity ID detection ──────────────────────────────────────────────────
  function extractEntityId(url) {
    const patterns = [/entityId=(\d+)/, /\/course\/(\d+)/, /\/batch\/(\d+)/, /courseId=(\d+)/, /batchId=(\d+)/];
    for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
    return null;
  }

  function reportEntity() {
    const id = extractEntityId(window.location.href);
    if (id) chrome.storage.local.set({ lastEntityId: id });
  }

  reportEntity();

  // Watch SPA navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      reportEntity();
      checkPendingLecture();
    }
  }).observe(document.body, { childList: true, subtree: true });

  // Also intercept XHR to capture entityId from API calls
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    const id = extractEntityId(url);
    if (id) chrome.storage.local.set({ lastEntityId: id });
    return origOpen.apply(this, arguments);
  };

  // ── Pending lecture auto-click ───────────────────────────────────────────
  // When background.js can't DOM-click immediately (recordings list not loaded),
  // it stores a pendingLecture. We watch for the recordings list to appear and click it.

  function tryClickPending(liveSessionId, lectureId, lectureName) {
    // Try data attributes first
    const attrs = [
      `[data-id="${liveSessionId}"]`,
      `[data-session-id="${liveSessionId}"]`,
      `[data-live-session-id="${liveSessionId}"]`,
      `[data-content-id="${lectureId}"]`,
    ];
    for (const sel of attrs) {
      const el = document.querySelector(sel);
      if (el) { el.click(); return true; }
    }

    // Try thumbnail image src match
    const imgs = document.querySelectorAll(`img[src*="${liveSessionId}"]`);
    if (imgs.length) {
      const card = imgs[0].closest('[class*="card"],[class*="item"],[class*="video"],[class*="recording"],li') || imgs[0].parentElement;
      if (card) { card.click(); return true; }
    }

    // Try text match
    const nameLower = (lectureName || '').toLowerCase().slice(0, 25);
    if (nameLower) {
      const candidates = document.querySelectorAll(
        '[class*="record"],[class*="video"],[class*="lecture"],[class*="session"],[class*="card"],[class*="class"]'
      );
      for (const el of candidates) {
        if (el.textContent.toLowerCase().includes(nameLower)) {
          const btn = el.querySelector('button,a,[role="button"]') || el;
          btn.click();
          return true;
        }
      }
    }

    return false;
  }

  async function checkPendingLecture() {
    const data = await new Promise(r => chrome.storage.local.get(['pendingLecture'], r));
    const p = data.pendingLecture;
    if (!p) return;
    if (Date.now() - p.ts > 30000) { // stale after 30s
      chrome.storage.local.remove('pendingLecture');
      return;
    }

    const clicked = tryClickPending(p.liveSessionId, p.lectureId, p.lectureName);
    if (clicked) {
      chrome.storage.local.remove('pendingLecture');
    }
  }

  // Check on load
  checkPendingLecture();

  // Also watch for DOM changes — recordings list may load async
  let pendingObserver = null;
  chrome.storage.local.get(['pendingLecture'], (data) => {
    if (!data.pendingLecture) return;

    let attempts = 0;
    pendingObserver = new MutationObserver(() => {
      attempts++;
      if (attempts > 200) { pendingObserver?.disconnect(); return; } // give up after ~20s
      checkPendingLecture().then(done => { if (done) pendingObserver?.disconnect(); });
    });
    pendingObserver.observe(document.body, { childList: true, subtree: true });
  });

  // Listen from popup
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'PING') sendResponse({ alive: true, url: location.href });
    if (msg.type === 'GET_ENTITY') sendResponse({ entityId: extractEntityId(location.href) });
  });

})();
