// ============================================================
// ClassPlus Organizer — Main World Inject Script
// ============================================================
// This script runs in the page's main JavaScript context.
// It monkey-patches window.fetch to intercept ClassPlus API responses.

(function () {
  'use strict';

  const RECORDINGS_URL_PATTERN = /api\.classplusapp\.com\/mm\/v3\/video\/recordings/;
  const MESSAGE_TYPE = 'CLASSPLUS_ORGANIZER_INTERCEPT';

  // Store the original fetch
  const originalFetch = window.fetch;

  // Override fetch
  window.fetch = async function (...args: Parameters<typeof fetch>): Promise<Response> {
    const request = args[0];
    let url = '';

    if (typeof request === 'string') {
      url = request;
    } else if (request instanceof Request) {
      url = request.url;
    } else if (request instanceof URL) {
      url = request.toString();
    }

    // Call the original fetch
    const response = await originalFetch.apply(this, args);

    // Check if this is a recordings API call
    if (RECORDINGS_URL_PATTERN.test(url)) {
      try {
        // Clone the response so we can read the body without consuming it
        const cloned = response.clone();
        const data = await cloned.json();

        if (data?.status === 'success' && data?.data?.list) {
          // Extract courseId from the URL
          const courseIdMatch = url.match(/entityId=(\d+)/);
          const courseId = courseIdMatch ? courseIdMatch[1] : 'unknown';

          // Send intercepted data to content script
          window.postMessage(
            {
              type: MESSAGE_TYPE,
              payload: {
                lectures: data.data.list,
                totalCount: data.data.totalCount,
                courseId,
              },
            },
            '*'
          );

          console.log(
            `[ClassPlus Organizer] Intercepted ${data.data.list.length} lectures (course: ${courseId})`
          );
        }
      } catch (err) {
        console.warn('[ClassPlus Organizer] Failed to parse intercepted response:', err);
      }
    }

    return response;
  };

  console.log('[ClassPlus Organizer] Fetch interceptor installed');
})();
