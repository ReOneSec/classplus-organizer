// background.js — ClassPlus Organizer Service Worker

let capturedToken = null;

// Intercept outgoing requests to capture auth token
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const headers = details.requestHeaders || [];
    const tokenHeader = headers.find(h => h.name.toLowerCase() === 'x-access-token');
    if (tokenHeader?.value) {
      capturedToken = tokenHeader.value;
      chrome.storage.local.set({ authToken: capturedToken, tokenCapturedAt: Date.now() });
    }
    const url = new URL(details.url);
    const entityId = url.searchParams.get('entityId');
    if (entityId) chrome.storage.local.set({ lastEntityId: entityId });
  },
  { urls: ['https://api.classplusapp.com/*'] },
  ['requestHeaders']
);

// Message handler
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === 'GET_AUTH') {
    chrome.storage.local.get(['authToken', 'lastEntityId', 'tokenCapturedAt'], sendResponse);
    return true;
  }

  if (msg.type === 'FETCH_ALL_LECTURES') {
    fetchAllLectures(msg.entityId, msg.token)
      .then(lectures => sendResponse({ success: true, lectures }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (msg.type === 'OPEN_LECTURE') {
    openLecture(msg)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// ── THE REAL FIX ──────────────────────────────────────────────────────────────
// ClassPlus rejects any URL navigation that doesn't originate from its own
// React app state (session validation on every route change).
// Solution: inject JS into the EXISTING authenticated tab to click the actual
// lecture DOM element — exactly as the user would do manually.
// No URL change, no session invalidation, no access forbidden.

async function openLecture({ entityId, liveSessionId, lectureId, lectureName }) {
  const cpTabs = await chrome.tabs.query({ url: 'https://web.classplusapp.com/*' });

  if (cpTabs.length === 0) {
    // No ClassPlus tab open — we must open one and wait for user to log in
    return { success: false, error: 'no_tab', needsTab: true };
  }

  // Pick the tab most likely to be on the recordings page
  const tab = cpTabs.sort((a, b) => b.id - a.id)[0];
  await chrome.windows.update(tab.windowId, { focused: true });
  await chrome.tabs.update(tab.id, { active: true });

  // Inject script that finds and clicks the lecture card in ClassPlus DOM
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: clickLectureInDOM,
    args: [liveSessionId, lectureId, lectureName],
  });

  const result = results?.[0]?.result;

  if (result?.found) {
    return { success: true, method: 'dom-click' };
  }

  // DOM click failed — the recordings list isn't loaded on this page.
  // Navigate the tab to the recordings section first, then retry.
  return await navigateThenClick(tab, entityId, liveSessionId, lectureId, lectureName);
}

// This function runs INSIDE the ClassPlus tab (no extension APIs available here)
function clickLectureInDOM(liveSessionId, lectureId, lectureName) {
  // Strategy 1: find by data attributes ClassPlus uses
  const selectors = [
    `[data-id="${liveSessionId}"]`,
    `[data-session-id="${liveSessionId}"]`,
    `[data-live-session-id="${liveSessionId}"]`,
    `[data-content-id="${lectureId}"]`,
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      el.click();
      return { found: true, method: 'data-attr' };
    }
  }

  // Strategy 2: find by lecture name text match inside clickable cards
  const clickables = document.querySelectorAll(
    '[class*="video"], [class*="lecture"], [class*="recording"], [class*="session"], [class*="card"], [class*="item"]'
  );

  const nameLower = (lectureName || '').toLowerCase().trim();
  for (const el of clickables) {
    const text = el.textContent?.toLowerCase().trim() || '';
    if (nameLower && text.includes(nameLower.slice(0, 20))) {
      // Make sure it's actually clickable (has onclick or is a button/anchor)
      const clickTarget = el.querySelector('button, a, [role="button"]') || el;
      clickTarget.click();
      return { found: true, method: 'text-match' };
    }
  }

  // Strategy 3: look for thumbnail images with liveSessionId in src URL
  const imgs = document.querySelectorAll('img[src*="' + liveSessionId + '"]');
  if (imgs.length > 0) {
    const card = imgs[0].closest('[class*="card"], [class*="item"], [class*="video"], li, div[onclick]');
    if (card) {
      card.click();
      return { found: true, method: 'thumbnail' };
    }
    imgs[0].click();
    return { found: true, method: 'img-click' };
  }

  return { found: false };
}

async function navigateThenClick(tab, entityId, liveSessionId, lectureId, lectureName) {
  // Navigate to the course recordings page
  // ClassPlus SPA - try known URL patterns
  const urls = [
    `https://web.classplusapp.com/course/${entityId}`,
    `https://web.classplusapp.com/`,
  ];

  await chrome.tabs.update(tab.id, { url: urls[0] });

  // Wait for page to load and recordings to render
  await waitForTabLoad(tab.id);
  await new Promise(r => setTimeout(r, 2500)); // let React render

  // Retry the DOM click
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: clickLectureInDOM,
    args: [liveSessionId, lectureId, lectureName],
  });

  const result = results?.[0]?.result;
  if (result?.found) return { success: true, method: 'navigate-then-click' };

  // Last resort: store the target lecture in storage, content script will 
  // auto-click when it detects the recordings list is loaded
  await chrome.storage.local.set({
    pendingLecture: { liveSessionId, lectureId, lectureName, entityId, ts: Date.now() }
  });

  return { success: true, method: 'pending-auto-click' };
}

function waitForTabLoad(tabId) {
  return new Promise(resolve => {
    const listener = (id, info) => {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
    setTimeout(resolve, 8000); // timeout fallback
  });
}

async function fetchAllLectures(entityId, token) {
  let all = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const res = await fetch(
      `https://api.classplusapp.com/mm/v3/video/recordings?entityType=course&entityId=${entityId}&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'api-version': '52',
          'origin': 'https://web.classplusapp.com',
          'referer': 'https://web.classplusapp.com/',
          'region': 'IN',
          'x-access-token': token,
        }
      }
    );
    const data = await res.json();
    if (data.status !== 'success' || !data.data?.list?.length) break;
    all = all.concat(data.data.list);
    if (data.data.list.length < limit) break;
    offset += limit;
    await new Promise(r => setTimeout(r, 120));
  }
  return all;
}
