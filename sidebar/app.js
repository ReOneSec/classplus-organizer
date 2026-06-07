// ============================================================
// ClassPlus Organizer — Vanilla JS App Logic
// ============================================================

let rawLectures = [];
let userData = {
  bookmarks: [],
  status: {},
  tags: {},
  folders: [],
  recentlyOpened: [],
  customTags: [],
  totalCount: 0
};
let currentCourseId = null;

let currentView = 'all'; // all, bookmarks, folders, dashboard
let searchQuery = '';
let currentSort = 'newest';
let filters = { teacher: '', status: 'all' };

// DOM Elements
const els = {
  tabs: document.querySelectorAll('.tab'),
  controlsArea: document.getElementById('controls-area'),
  mainContent: document.getElementById('main-content'),
  dashboardView: document.getElementById('dashboard-view'),
  lectureList: document.getElementById('lecture-list'),
  searchInput: document.getElementById('search-input'),
  searchCount: document.getElementById('search-count'),
  clearSearch: document.getElementById('clear-search'),
  toggleFilters: document.getElementById('toggle-filters'),
  filterBody: document.getElementById('filter-body'),
  filterDot: document.getElementById('filter-dot'),
  teacherFilter: document.getElementById('teacher-filter'),
  sortSelect: document.getElementById('sort-select'),
  statusChips: document.querySelectorAll('#status-chips .chip'),
  clearFilters: document.getElementById('clear-filters'),
  emptyState: document.getElementById('empty-state'),
  emptyTitle: document.getElementById('empty-title'),
  emptyDesc: document.getElementById('empty-desc'),
  captureStatus: document.getElementById('capture-status'),
  quickNav: document.getElementById('quick-nav'),
  jumpBtns: document.querySelectorAll('.jump-btn'),
  statTotal: document.getElementById('stat-total'),
  statCompleted: document.getElementById('stat-completed'),
  statPending: document.getElementById('stat-pending'),
  statStarred: document.getElementById('stat-starred'),
  progressPct: document.getElementById('progress-pct'),
  progressText: document.getElementById('progress-text'),
  donutFill: document.getElementById('donut-fill'),
  overlay: document.getElementById('overlay'),
  contextMenu: document.getElementById('context-menu')
};

// Initialize
async function init() {
  await loadData();
  setupEventListeners();
  render();

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      loadData().then(render);
    }
  });
}

async function loadData() {
  return new Promise(resolve => {
    chrome.storage.local.get(['lastCourseId', 'userData'], (result) => {
      if (result.lastCourseId) {
        currentCourseId = result.lastCourseId;
        chrome.storage.local.get([`course_${currentCourseId}`], (courseData) => {
          rawLectures = courseData[`course_${currentCourseId}`] || [];
          userData = result.userData || userData;
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

function saveUserData() {
  chrome.storage.local.set({ userData });
}

// Formatters
function formatDuration(sec) {
  if (!sec) return '00:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso) {
  if (!iso) return 'Unknown date';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Logic
function getEnrichedLectures() {
  return rawLectures.map(l => ({
    ...l,
    isBookmarked: userData.bookmarks.includes(l.id),
    status: userData.status[l.id] || 'not_started'
  }));
}

function getFilteredLectures() {
  let list = getEnrichedLectures();

  // View filtering
  if (currentView === 'bookmarks') {
    list = list.filter(l => l.isBookmarked);
  }

  // Search filtering (simple native fallback)
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(l => 
      l.name.toLowerCase().includes(q) || 
      l.teacher.toLowerCase().includes(q)
    );
  }

  // Teacher filter
  if (filters.teacher) {
    list = list.filter(l => l.teacher === filters.teacher);
  }

  // Status filter
  if (filters.status !== 'all') {
    list = list.filter(l => l.status === filters.status);
  }

  // Sorting
  list.sort((a, b) => {
    switch (currentSort) {
      case 'newest': return new Date(b.date) - new Date(a.date);
      case 'oldest': return new Date(a.date) - new Date(b.date);
      case 'duration_high': return b.durationSeconds - a.durationSeconds;
      case 'duration_low': return a.durationSeconds - b.durationSeconds;
      case 'alphabetical': return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

  return list;
}

// Rendering
function render() {
  els.captureStatus.innerText = rawLectures.length > 0 
    ? `${rawLectures.length} lectures captured` 
    : 'Browse a course to start';

  updateTeachersDropdown();

  if (currentView === 'dashboard') {
    els.controlsArea.classList.add('hidden');
    els.mainContent.classList.add('hidden');
    els.quickNav.classList.add('hidden');
    els.dashboardView.classList.remove('hidden');
    renderDashboard();
  } else {
    els.controlsArea.classList.remove('hidden');
    els.mainContent.classList.remove('hidden');
    els.quickNav.classList.remove('hidden');
    els.dashboardView.classList.add('hidden');
    
    const list = getFilteredLectures();
    
    els.searchCount.innerText = searchQuery ? `${list.length}/${rawLectures.length}` : '';
    els.clearSearch.classList.toggle('hidden', !searchQuery);
    
    const hasFilters = filters.teacher || filters.status !== 'all';
    els.filterDot.classList.toggle('hidden', !hasFilters);
    els.clearFilters.classList.toggle('hidden', !hasFilters);

    renderList(list);
  }
}

function updateTeachersDropdown() {
  const teachers = [...new Set(rawLectures.map(l => l.teacher))].filter(Boolean).sort();
  els.teacherFilter.innerHTML = '<option value="">All Teachers</option>' + 
    teachers.map(t => `<option value="${t}" ${filters.teacher === t ? 'selected' : ''}>${t}</option>`).join('');
}

function renderList(list) {
  if (list.length === 0) {
    els.lectureList.innerHTML = '';
    els.emptyState.classList.remove('hidden');
    if (searchQuery) {
      els.emptyTitle.innerText = 'No results found';
      els.emptyDesc.innerText = 'Try adjusting your search or filters.';
    } else if (currentView === 'bookmarks') {
      els.emptyTitle.innerText = 'No bookmarks yet';
      els.emptyDesc.innerText = 'Click the ⭐ icon on any lecture to bookmark it.';
    } else {
      els.emptyTitle.innerText = 'No lectures captured yet';
      els.emptyDesc.innerText = 'Browse your ClassPlus course and lectures will appear here.';
    }
    return;
  }

  els.emptyState.classList.add('hidden');
  
  els.lectureList.innerHTML = list.map(l => `
    <div class="glass lecture-card" data-id="${l.id}">
      <div class="thumb-container">
        <img src="${l.thumbnailUrl || ''}" onerror="this.style.display='none'">
        <span class="duration-badge">${formatDuration(l.durationSeconds)}</span>
      </div>
      <div class="card-content">
        <div class="card-title" title="${l.name}">${l.name}</div>
        <div class="card-meta">👨‍🏫 ${l.teacher} • ${formatDate(l.date)}</div>
      </div>
      <div class="card-actions">
        <button class="action-btn btn-star ${l.isBookmarked ? 'active' : ''}" data-id="${l.id}">
          ${l.isBookmarked ? '⭐' : '☆'}
        </button>
      </div>
    </div>
  `).join('');

  // Attach card events
  document.querySelectorAll('.btn-star').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBookmark(parseInt(e.currentTarget.dataset.id));
    });
  });
}

function renderDashboard() {
  const list = getEnrichedLectures();
  const total = list.length;
  const completed = list.filter(l => l.status === 'completed').length;
  const pending = total - completed;
  const starred = userData.bookmarks.length;

  els.statTotal.innerText = total;
  els.statCompleted.innerText = completed;
  els.statPending.innerText = pending;
  els.statStarred.innerText = starred;

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  els.progressPct.innerText = `${pct}%`;
  els.progressText.innerText = `${completed} of ${total} lectures completed`;

  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (pct / 100) * circumference;
  els.donutFill.style.strokeDashoffset = offset;
}

// Actions
function toggleBookmark(id) {
  const idx = userData.bookmarks.indexOf(id);
  if (idx > -1) {
    userData.bookmarks.splice(idx, 1);
  } else {
    userData.bookmarks.push(id);
  }
  saveUserData();
  render();
}

// Event Listeners
function setupEventListeners() {
  // Tabs
  els.tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      els.tabs.forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentView = e.currentTarget.dataset.view;
      render();
    });
  });

  // Search
  let debounceTimeout;
  els.searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchQuery = e.target.value;
      render();
    }, 150);
  });

  els.clearSearch.addEventListener('click', () => {
    els.searchInput.value = '';
    searchQuery = '';
    render();
  });

  // Filters
  els.toggleFilters.addEventListener('click', () => {
    els.filterBody.classList.toggle('hidden');
  });

  els.teacherFilter.addEventListener('change', (e) => {
    filters.teacher = e.target.value;
    render();
  });

  els.statusChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      els.statusChips.forEach(c => c.classList.remove('active'));
      e.currentTarget.classList.add('active');
      filters.status = e.currentTarget.dataset.status;
      render();
    });
  });

  els.clearFilters.addEventListener('click', () => {
    filters = { teacher: '', status: 'all' };
    els.teacherFilter.value = '';
    els.statusChips.forEach(c => c.classList.toggle('active', c.dataset.status === 'all'));
    render();
  });

  els.sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    render();
  });

  // Quick Nav Jump
  els.jumpBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.dataset.target;
      const cards = document.querySelectorAll('.lecture-card');
      if (cards.length === 0) return;
      
      let index = 0;
      if (target === 'last') index = cards.length - 1;
      else index = Math.min(parseInt(target), cards.length - 1);
      
      cards[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}

// Start
document.addEventListener('DOMContentLoaded', init);
