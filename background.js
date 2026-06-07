// ============================================================
// ClassPlus Organizer — Background Service Worker
// ============================================================

chrome.action.onClicked.addListener((tab) => {
  if (tab.id && tab.url?.includes('classplusapp.com')) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LECTURES_RECEIVED') {
    const { lectures, totalCount, courseId } = message.payload;
    
    // Store raw data in chrome.storage.local under the courseId
    chrome.storage.local.get([`course_${courseId}`, 'userData'], (result) => {
      const existing = result[`course_${courseId}`] || [];
      const existingMap = new Map(existing.map((l: any) => [l.id, l]));
      
      let added = 0;
      lectures.forEach((l: any) => {
        if (!existingMap.has(l.id)) {
          existingMap.set(l.id, l);
          added++;
        }
      });
      
      if (added > 0 || !result[`course_${courseId}`]) {
        const merged = Array.from(existingMap.values());
        
        // Ensure default userData structure exists
        const defaultUserData = {
          bookmarks: [],
          status: {},
          tags: {},
          folders: [],
          recentlyOpened: [],
          customTags: [],
          totalCount: totalCount
        };

        const userData = result.userData || defaultUserData;
        // update total count if greater
        if (totalCount > (userData.totalCount || 0)) {
            userData.totalCount = totalCount;
        }

        chrome.storage.local.set({
          [`course_${courseId}`]: merged,
          userData: userData,
          lastCourseId: courseId
        }, () => {
          console.log(`[ClassPlus Organizer] Saved ${added} new lectures. Total: ${merged.length}`);
        });
      }
    });
    
    sendResponse({ success: true });
  }
});
