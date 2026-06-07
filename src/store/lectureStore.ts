// ============================================================
// ClassPlus Organizer — Zustand Store
// ============================================================

import { create } from 'zustand';
import type {
  Lecture,
  LectureWithUserData,
  UserData,
  FilterState,
  SortOption,
  ActiveView,
  LectureStatus,
  FolderCollection,
} from '@/types/lecture';
import { DEFAULT_FILTERS } from '@/types/lecture';
import { buildSearchIndex, searchLectures } from './searchEngine';

// ─── Helper: Check if running in extension context ─────────

function isChromeExtension(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime?.sendMessage;
}

// ─── Helper: Send message to background ────────────────────

async function sendToBackground(type: string, payload?: unknown): Promise<unknown> {
  if (!isChromeExtension()) {
    // Dev fallback: use IndexedDB directly
    return devStorageFallback(type, payload);
  }
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      resolve(response?.data);
    });
  });
}

// ─── Dev mode fallback storage ─────────────────────────────

async function devStorageFallback(type: string, payload?: unknown): Promise<unknown> {
  const LECTURES_KEY = 'cp_organizer_lectures';
  const USERDATA_KEY = 'cp_organizer_user_data';

  if (type === 'GET_LECTURES') {
    const data = localStorage.getItem(LECTURES_KEY);
    return data ? JSON.parse(data) : [];
  }
  if (type === 'SAVE_LECTURES') {
    localStorage.setItem(LECTURES_KEY, JSON.stringify(payload));
    return null;
  }
  if (type === 'GET_USER_DATA') {
    const data = localStorage.getItem(USERDATA_KEY);
    return data ? JSON.parse(data) : null;
  }
  if (type === 'SAVE_USER_DATA') {
    localStorage.setItem(USERDATA_KEY, JSON.stringify(payload));
    return null;
  }
  return null;
}

// ─── Generate unique ID ────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ─── Store Interface ───────────────────────────────────────

interface LectureStore {
  // State
  lectures: Lecture[];
  userData: UserData;
  searchQuery: string;
  filters: FilterState;
  sortBy: SortOption;
  activeView: ActiveView;
  selectedFolderId: string | null;
  isLoading: boolean;
  sidebarOpen: boolean;

  // Computed
  enrichedLectures: LectureWithUserData[];
  filteredLectures: LectureWithUserData[];
  teachers: string[];

  // Actions — Data
  initialize: () => Promise<void>;
  setLectures: (lectures: Lecture[]) => void;
  setUserData: (userData: UserData) => void;
  persistUserData: () => Promise<void>;
  persistLectures: () => Promise<void>;

  // Actions — Search & Filter
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setSortBy: (sort: SortOption) => void;

  // Actions — Views
  setActiveView: (view: ActiveView) => void;
  setSelectedFolderId: (folderId: string | null) => void;
  setSidebarOpen: (open: boolean) => void;

  // Actions — Bookmarks
  toggleBookmark: (lectureId: number) => void;

  // Actions — Status
  setLectureStatus: (lectureId: number, status: LectureStatus) => void;

  // Actions — Tags
  addTag: (lectureId: number, tag: string) => void;
  removeTag: (lectureId: number, tag: string) => void;
  addCustomTag: (tag: string) => void;

  // Actions — Folders
  createFolder: (name: string, color?: string) => void;
  deleteFolder: (folderId: string) => void;
  renameFolder: (folderId: string, name: string) => void;
  addToFolder: (folderId: string, lectureId: number) => void;
  removeFromFolder: (folderId: string, lectureId: number) => void;

  // Actions — Continue Watching
  markOpened: (lectureId: number) => void;

  // Actions — Recompute
  recompute: () => void;
}

// ─── Folder Colors ─────────────────────────────────────────

const FOLDER_COLORS = [
  '#7C3AED', '#06B6D4', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6',
];

// ─── Store Implementation ──────────────────────────────────

export const useLectureStore = create<LectureStore>((set, get) => ({
  // Initial state
  lectures: [],
  userData: {
    bookmarks: [],
    statuses: {},
    tags: {},
    folders: [],
    recentlyOpened: [],
    customTags: [],
    totalCount: 0,
  },
  searchQuery: '',
  filters: { ...DEFAULT_FILTERS },
  sortBy: 'newest',
  activeView: 'all',
  selectedFolderId: null,
  isLoading: true,
  sidebarOpen: false,

  // Computed (recomputed via recompute())
  enrichedLectures: [],
  filteredLectures: [],
  teachers: [],

  // ─── Initialize ────────────────────────────────────────

  initialize: async () => {
    set({ isLoading: true });

    const [lectures, userData] = await Promise.all([
      sendToBackground('GET_LECTURES') as Promise<Lecture[] | null>,
      sendToBackground('GET_USER_DATA') as Promise<UserData | null>,
    ]);

    set({
      lectures: lectures || [],
      userData: userData || get().userData,
      isLoading: false,
    });

    get().recompute();
  },

  // ─── Setters ───────────────────────────────────────────

  setLectures: (lectures) => {
    set({ lectures });
    get().recompute();
  },

  setUserData: (userData) => {
    set({ userData });
    get().recompute();
  },

  persistUserData: async () => {
    await sendToBackground('SAVE_USER_DATA', get().userData);
  },

  persistLectures: async () => {
    await sendToBackground('SAVE_LECTURES', get().lectures);
  },

  // ─── Search & Filter ──────────────────────────────────

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().recompute();
  },

  setFilters: (partial) => {
    set({ filters: { ...get().filters, ...partial } });
    get().recompute();
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS }, searchQuery: '' });
    get().recompute();
  },

  setSortBy: (sort) => {
    set({ sortBy: sort });
    get().recompute();
  },

  // ─── Views ─────────────────────────────────────────────

  setActiveView: (view) => {
    set({ activeView: view, selectedFolderId: null });
    get().recompute();
  },

  setSelectedFolderId: (folderId) => {
    set({ selectedFolderId: folderId });
    get().recompute();
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // ─── Bookmarks ─────────────────────────────────────────

  toggleBookmark: (lectureId) => {
    const { userData } = get();
    const bookmarks = [...userData.bookmarks];
    const idx = bookmarks.indexOf(lectureId);
    if (idx >= 0) {
      bookmarks.splice(idx, 1);
    } else {
      bookmarks.push(lectureId);
    }
    set({ userData: { ...userData, bookmarks } });
    get().persistUserData();
    get().recompute();
  },

  // ─── Status ────────────────────────────────────────────

  setLectureStatus: (lectureId, status) => {
    const { userData } = get();
    set({
      userData: {
        ...userData,
        statuses: { ...userData.statuses, [lectureId]: status },
      },
    });
    get().persistUserData();
    get().recompute();
  },

  // ─── Tags ──────────────────────────────────────────────

  addTag: (lectureId, tag) => {
    const { userData } = get();
    const lectureTags = userData.tags[lectureId] || [];
    if (lectureTags.includes(tag)) return;
    set({
      userData: {
        ...userData,
        tags: { ...userData.tags, [lectureId]: [...lectureTags, tag] },
      },
    });
    get().persistUserData();
    get().recompute();
  },

  removeTag: (lectureId, tag) => {
    const { userData } = get();
    const lectureTags = userData.tags[lectureId] || [];
    set({
      userData: {
        ...userData,
        tags: {
          ...userData.tags,
          [lectureId]: lectureTags.filter((t) => t !== tag),
        },
      },
    });
    get().persistUserData();
    get().recompute();
  },

  addCustomTag: (tag) => {
    const { userData } = get();
    if (userData.customTags.includes(tag)) return;
    set({
      userData: {
        ...userData,
        customTags: [...userData.customTags, tag],
      },
    });
    get().persistUserData();
  },

  // ─── Folders ───────────────────────────────────────────

  createFolder: (name, color) => {
    const { userData } = get();
    const folder: FolderCollection = {
      id: generateId(),
      name,
      lectureIds: [],
      createdAt: Date.now(),
      color: color || FOLDER_COLORS[userData.folders.length % FOLDER_COLORS.length],
    };
    set({
      userData: {
        ...userData,
        folders: [...userData.folders, folder],
      },
    });
    get().persistUserData();
  },

  deleteFolder: (folderId) => {
    const { userData } = get();
    set({
      userData: {
        ...userData,
        folders: userData.folders.filter((f) => f.id !== folderId),
      },
    });
    if (get().selectedFolderId === folderId) {
      set({ selectedFolderId: null, activeView: 'all' });
    }
    get().persistUserData();
    get().recompute();
  },

  renameFolder: (folderId, name) => {
    const { userData } = get();
    set({
      userData: {
        ...userData,
        folders: userData.folders.map((f) =>
          f.id === folderId ? { ...f, name } : f
        ),
      },
    });
    get().persistUserData();
  },

  addToFolder: (folderId, lectureId) => {
    const { userData } = get();
    set({
      userData: {
        ...userData,
        folders: userData.folders.map((f) =>
          f.id === folderId && !f.lectureIds.includes(lectureId)
            ? { ...f, lectureIds: [...f.lectureIds, lectureId] }
            : f
        ),
      },
    });
    get().persistUserData();
    get().recompute();
  },

  removeFromFolder: (folderId, lectureId) => {
    const { userData } = get();
    set({
      userData: {
        ...userData,
        folders: userData.folders.map((f) =>
          f.id === folderId
            ? { ...f, lectureIds: f.lectureIds.filter((id) => id !== lectureId) }
            : f
        ),
      },
    });
    get().persistUserData();
    get().recompute();
  },

  // ─── Continue Watching ─────────────────────────────────

  markOpened: (lectureId) => {
    const { userData } = get();
    const recent = [
      lectureId,
      ...userData.recentlyOpened.filter((id) => id !== lectureId),
    ].slice(0, 20);
    set({
      userData: {
        ...userData,
        recentlyOpened: recent,
      },
    });
    get().persistUserData();
    get().recompute();
  },

  // ─── Recompute derived state ───────────────────────────

  recompute: () => {
    const { lectures, userData, searchQuery, filters, sortBy, activeView, selectedFolderId } = get();

    // 1. Enrich lectures with user data
    const enriched: LectureWithUserData[] = lectures.map((l) => ({
      ...l,
      bookmarked: userData.bookmarks.includes(l.id),
      status: userData.statuses[l.id] || 'not_started',
      tags: userData.tags[l.id] || [],
      folders: userData.folders
        .filter((f) => f.lectureIds.includes(l.id))
        .map((f) => f.id),
      lastOpened: userData.recentlyOpened.includes(l.id)
        ? userData.recentlyOpened.indexOf(l.id)
        : null,
    }));

    // 2. Build search index
    buildSearchIndex(enriched);

    // 3. Get unique teachers
    const teachers = [...new Set(enriched.map((l) => l.teacher))].sort();

    // 4. Apply view filter
    let filtered = enriched;

    if (activeView === 'bookmarks') {
      filtered = filtered.filter((l) => l.bookmarked);
    } else if (activeView === 'folders' && selectedFolderId) {
      const folder = userData.folders.find((f) => f.id === selectedFolderId);
      if (folder) {
        const idSet = new Set(folder.lectureIds);
        filtered = filtered.filter((l) => idSet.has(l.id));
      }
    }

    // 5. Apply search
    if (searchQuery.trim()) {
      const matchIds = searchLectures(searchQuery);
      if (matchIds.size > 0) {
        filtered = filtered.filter((l) => matchIds.has(l.id));
      }
    }

    // 6. Apply filters
    if (filters.teacher) {
      filtered = filtered.filter((l) => l.teacher === filters.teacher);
    }
    if (filters.durationMin !== null) {
      filtered = filtered.filter((l) => l.durationSeconds >= filters.durationMin!);
    }
    if (filters.durationMax !== null) {
      filtered = filtered.filter((l) => l.durationSeconds <= filters.durationMax!);
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      filtered = filtered.filter((l) => l.dateTimestamp >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime();
      filtered = filtered.filter((l) => l.dateTimestamp <= to);
    }
    if (filters.subject) {
      filtered = filtered.filter((l) => l.tags.includes(filters.subject));
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter((l) => l.status === filters.status);
    }

    // 7. Apply sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.dateTimestamp - a.dateTimestamp;
        case 'oldest':
          return a.dateTimestamp - b.dateTimestamp;
        case 'duration_high':
          return b.durationSeconds - a.durationSeconds;
        case 'duration_low':
          return a.durationSeconds - b.durationSeconds;
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    set({ enrichedLectures: enriched, filteredLectures: filtered, teachers });
  },
}));
