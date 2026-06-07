// ============================================================
// ClassPlus Organizer — Fetch Interceptor
// ============================================================

const INTERCEPT_MESSAGE_TYPE = 'CLASSPLUS_ORGANIZER_INTERCEPT';

function extractCourseIdFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('courseId');
  } catch (e) {
    return null;
  }
}

// Intercept window.fetch
const originalFetch = window.fetch;

window.fetch = async function (...args) {
  const url = args[0];
  
  if (typeof url === 'string' && url.includes('/mm/v3/video/recordings')) {
    const courseId = extractCourseIdFromUrl(url);
    
    try {
      const response = await originalFetch.apply(this, args);
      const clonedResponse = response.clone();
      
      clonedResponse.json().then(data => {
        if (data?.data?.recordings && courseId) {
          const lectures = data.data.recordings.map((rec) => ({
            id: rec.id,
            name: rec.name || rec.title || 'Untitled Lecture',
            durationSeconds: rec.duration || 0,
            date: rec.createdAt || rec.date || new Date().toISOString(),
            teacher: rec.teacherName || rec.creatorName || 'Unknown Teacher',
            thumbnailUrl: rec.thumbnailUrl || rec.imageUrl || '',
            url: rec.url || '',
            contentHashId: rec.contentHashId || '',
            isLocked: rec.isLocked || false
          }));

          const totalCount = data.data.totalCount || lectures.length;

          // Send data to content script
          window.postMessage({
            type: INTERCEPT_MESSAGE_TYPE,
            payload: {
              lectures,
              totalCount,
              courseId
            }
          }, '*');
          
          console.log(`[ClassPlus Organizer] Intercepted ${lectures.length} lectures.`);
        }
      }).catch(err => console.error('[ClassPlus Organizer] Error parsing fetch response', err));
      
      return response;
    } catch (e) {
      console.error('[ClassPlus Organizer] Fetch interception failed', e);
      return originalFetch.apply(this, args);
    }
  }

  return originalFetch.apply(this, args);
};
