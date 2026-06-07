// ============================================================
// ClassPlus Organizer — Content Script
// ============================================================
// Bridges the injected main-world script with the background worker.
// Also mounts the sidebar React app into the page via Shadow DOM.

const INTERCEPT_MESSAGE_TYPE = 'CLASSPLUS_ORGANIZER_INTERCEPT';

// ─── 1. Inject the fetch interceptor into the main world ────

function injectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('src/content/inject.ts');
  script.type = 'module';
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => script.remove();
}

injectScript();

// ─── 2. Listen for intercepted data from the injected script ─

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== INTERCEPT_MESSAGE_TYPE) return;

  const { lectures, totalCount, courseId } = event.data.payload;

  // Forward to background service worker
  chrome.runtime.sendMessage({
    type: 'LECTURES_RECEIVED',
    payload: { lectures, totalCount, courseId },
  });
});

// ─── 3. Create and mount the sidebar ───────────────────────

let sidebarContainer: HTMLDivElement | null = null;
let sidebarVisible = false;

function createSidebar() {
  if (sidebarContainer) return;

  // Create host element
  sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'classplus-organizer-root';
  document.body.appendChild(sidebarContainer);

  // Attach Shadow DOM for style isolation
  const shadow = sidebarContainer.attachShadow({ mode: 'open' });

  // Create the sidebar iframe to load our React app
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('src/sidebar/index.html');
  iframe.id = 'classplus-organizer-iframe';
  iframe.setAttribute('allowtransparency', 'true');

  // Style the host and iframe
  const style = document.createElement('style');
  style.textContent = `
    :host {
      all: initial;
      position: fixed;
      top: 0;
      right: 0;
      width: 420px;
      height: 100vh;
      z-index: 2147483647;
      pointer-events: none;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    :host(.visible) {
      pointer-events: auto;
    }

    #classplus-organizer-iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
      transform: translateX(100%);
      transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
      box-shadow: -8px 0 30px rgba(0, 0, 0, 0.5);
    }

    :host(.visible) #classplus-organizer-iframe {
      transform: translateX(0);
    }

    .backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0);
      transition: background 300ms ease;
      pointer-events: none;
    }

    :host(.visible) .backdrop {
      background: rgba(0, 0, 0, 0.3);
      pointer-events: auto;
    }
  `;

  // Backdrop for closing
  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';
  backdrop.addEventListener('click', () => toggleSidebar(false));

  shadow.appendChild(style);
  shadow.appendChild(backdrop);
  shadow.appendChild(iframe);
}

function toggleSidebar(forceState?: boolean) {
  if (!sidebarContainer) {
    createSidebar();
  }

  sidebarVisible = forceState !== undefined ? forceState : !sidebarVisible;

  if (sidebarVisible) {
    sidebarContainer!.shadowRoot!.host.classList.add('visible');
  } else {
    sidebarContainer!.shadowRoot!.host.classList.remove('visible');
  }
}

// ─── 4. Listen for toggle commands from background ─────────

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TOGGLE_SIDEBAR') {
    toggleSidebar();
  }
});

// ─── 5. Keyboard shortcut: Ctrl+Shift+O to toggle ─────────

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'O') {
    e.preventDefault();
    toggleSidebar();
  }
});

// Initialize sidebar (hidden by default)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createSidebar);
} else {
  createSidebar();
}

console.log('[ClassPlus Organizer] Content script loaded');
