(function(){const c="CLASSPLUS_ORGANIZER_INTERCEPT";function l(){const e=document.createElement("script");e.src=chrome.runtime.getURL("src/content/inject.ts"),e.type="module",(document.head||document.documentElement).appendChild(e),e.onload=()=>e.remove()}l();window.addEventListener("message",e=>{var d;if(e.source!==window||((d=e.data)==null?void 0:d.type)!==c)return;const{lectures:n,totalCount:s,courseId:o}=e.data.payload;chrome.runtime.sendMessage({type:"LECTURES_RECEIVED",payload:{lectures:n,totalCount:s,courseId:o}})});let t=null,a=!1;function i(){if(t)return;t=document.createElement("div"),t.id="classplus-organizer-root",document.body.appendChild(t);const e=t.attachShadow({mode:"open"}),n=document.createElement("iframe");n.src=chrome.runtime.getURL("src/sidebar/index.html"),n.id="classplus-organizer-iframe",n.setAttribute("allowtransparency","true");const s=document.createElement("style");s.textContent=`
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
  `;const o=document.createElement("div");o.className="backdrop",o.addEventListener("click",()=>r(!1)),e.appendChild(s),e.appendChild(o),e.appendChild(n)}function r(e){t||i(),a=e!==void 0?e:!a,a?t.shadowRoot.host.classList.add("visible"):t.shadowRoot.host.classList.remove("visible")}chrome.runtime.onMessage.addListener(e=>{e.type==="TOGGLE_SIDEBAR"&&r()});document.addEventListener("keydown",e=>{e.ctrlKey&&e.shiftKey&&e.key==="O"&&(e.preventDefault(),r())});document.readyState==="loading"?document.addEventListener("DOMContentLoaded",i):i();console.log("[ClassPlus Organizer] Content script loaded");
})()
