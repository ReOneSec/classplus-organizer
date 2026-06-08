// storage.js — Chrome Storage API helpers for ClassPlus Organizer

const Storage = {

  // ─── Lectures ───────────────────────────────────────────────
  async saveLectures(entityId, lectures) {
    return new Promise(resolve => {
      chrome.storage.local.set({ [`lectures_${entityId}`]: lectures }, resolve);
    });
  },

  async getLectures(entityId) {
    return new Promise(resolve => {
      chrome.storage.local.get([`lectures_${entityId}`], data => {
        resolve(data[`lectures_${entityId}`] || []);
      });
    });
  },

  // ─── User Data (bookmarks, status, tags, folders) ───────────
  async getUserData(entityId) {
    return new Promise(resolve => {
      chrome.storage.local.get([`userdata_${entityId}`], data => {
        resolve(data[`userdata_${entityId}`] || {});
      });
    });
  },

  async saveUserData(entityId, userData) {
    return new Promise(resolve => {
      chrome.storage.local.set({ [`userdata_${entityId}`]: userData }, resolve);
    });
  },

  async updateLectureUserData(entityId, lectureId, patch) {
    const userData = await this.getUserData(entityId);
    userData[lectureId] = { ...(userData[lectureId] || {}), ...patch };
    await this.saveUserData(entityId, userData);
    return userData[lectureId];
  },

  // ─── Recent Watches ─────────────────────────────────────────
  async addRecentWatch(lectureId) {
    return new Promise(resolve => {
      chrome.storage.local.get(['recentWatches'], data => {
        let recents = data.recentWatches || [];
        recents = [lectureId, ...recents.filter(id => id !== lectureId)].slice(0, 20);
        chrome.storage.local.set({ recentWatches: recents }, () => resolve(recents));
      });
    });
  },

  async getRecentWatches() {
    return new Promise(resolve => {
      chrome.storage.local.get(['recentWatches'], data => resolve(data.recentWatches || []));
    });
  },

  // ─── Folders ─────────────────────────────────────────────────
  async getFolders(entityId) {
    return new Promise(resolve => {
      chrome.storage.local.get([`folders_${entityId}`], data => {
        resolve(data[`folders_${entityId}`] || ['Revision', 'Important', 'English Grammar', 'Mock Analysis']);
      });
    });
  },

  async saveFolders(entityId, folders) {
    return new Promise(resolve => {
      chrome.storage.local.set({ [`folders_${entityId}`]: folders }, resolve);
    });
  },

  // ─── Auth ─────────────────────────────────────────────────────
  async getAuth() {
    return new Promise(resolve => {
      chrome.storage.local.get(['authToken', 'orgId', 'lastEntityId', 'tokenCapturedAt'], resolve);
    });
  },

  // ─── Metadata ─────────────────────────────────────────────────
  async getLastFetched(entityId) {
    return new Promise(resolve => {
      chrome.storage.local.get([`lastFetched_${entityId}`], data => resolve(data[`lastFetched_${entityId}`] || null));
    });
  },

  async setLastFetched(entityId) {
    return new Promise(resolve => {
      chrome.storage.local.set({ [`lastFetched_${entityId}`]: Date.now() }, resolve);
    });
  },

  // ─── Nuke ─────────────────────────────────────────────────────
  async clearEntityData(entityId) {
    return new Promise(resolve => {
      chrome.storage.local.remove([
        `lectures_${entityId}`,
        `userdata_${entityId}`,
        `folders_${entityId}`,
        `lastFetched_${entityId}`
      ], resolve);
    });
  }
};

window.CPStorage = Storage;
