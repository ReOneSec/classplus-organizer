// ============================================================
// ClassPlus Organizer — Content Script
// ============================================================

const INTERCEPT_MESSAGE_TYPE = 'CLASSPLUS_ORGANIZER_INTERCEPT';

function injectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => script.remove();
}

injectScript();

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== INTERCEPT_MESSAGE_TYPE) return;

  chrome.runtime.sendMessage({
    type: 'LECTURES_RECEIVED',
    payload: event.data.payload,
  });
});

let sidebarContainer = null;
let sidebarVisible = false;

function createSidebar() {
  if (sidebarContainer) return;

  sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'classplus-organizer-root';
  document.body.appendChild(sidebarContainer);

  const shadow = sidebarContainer.attachShadow({ mode: 'open' });

  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('sidebar/index.html');
  iframe.id = 'classplus-organizer-iframe';
  iframe.setAttribute('allowtransparency', 'true');

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
      font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
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

  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';
  backdrop.addEventListener('click', () => toggleSidebar(false));

  shadow.appendChild(style);
  shadow.appendChild(backdrop);
  shadow.appendChild(iframe);
}

function toggleSidebar(forceState) {
  if (!sidebarContainer) createSidebar();
  sidebarVisible = forceState !== undefined ? forceState : !sidebarVisible;
  if (sidebarVisible) {
    sidebarContainer.shadowRoot.host.classList.add('visible');
  } else {
    sidebarContainer.shadowRoot.host.classList.remove('visible');
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TOGGLE_SIDEBAR') toggleSidebar();
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'O') {
    e.preventDefault();
    toggleSidebar();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createSidebar);
} else {
  createSidebar();
}
