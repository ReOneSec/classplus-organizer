// ============================================================
// ClassPlus Organizer — Type Definitions
// ============================================================

/** Raw lecture data as returned by the ClassPlus API */
export interface RawLecture {
  id: number;
  name: string;
  duration: string;
  createdAt: string;
  createdAtText: string;
  thumbnailUrl: string;
  contentHashId: string;
  createdByText: string;
  tutorName: string;
  liveSessionId: number;
  videoType: string;
  vidKey: string;
  isLocked: number;
  isTrial: number;
  contentType: number;
  startedAtText: string;
  attachments: unknown;
  [key: string]: unknown;
}

/** API response shape for /mm/v3/video/recordings */
export interface RecordingsApiResponse {
  status: string;
  data: {
    list: RawLecture[];
    totalCount: number;
    emptyStateData: unknown;
    liveCardPromo: unknown;
  };
  message: string;
}

/** Normalized lecture for internal use */
export interface Lecture {
  id: number;
  name: string;
  teacher: string;
  duration: string;
  durationSeconds: number;
  date: string;
  dateTimestamp: number;
  thumbnailUrl: string;
  contentHashId: string;
  liveSessionId: number;
  videoType: string;
  vidKey: string;
  isLocked: boolean;
  courseId: string;
}

/** Lecture revision/watch status */
export type LectureStatus = 'not_started' | 'watching' | 'completed' | 'revise_later';

/** A user-created folder/collection */
export interface FolderCollection {
  id: string;
  name: string;
  lectureIds: number[];
  createdAt: number;
  color: string;
}

/** All user-managed data (stored separately from raw lecture data) */
export interface UserData {
  bookmarks: number[];
  statuses: Record<number, LectureStatus>;
  tags: Record<number, string[]>;
  folders: FolderCollection[];
  recentlyOpened: number[];
  customTags: string[];
  totalCount: number;
}

/** Lecture combined with user data for display */
export interface LectureWithUserData extends Lecture {
  bookmarked: boolean;
  status: LectureStatus;
  tags: string[];
  folders: string[];
  lastOpened: number | null;
}

/** Filter state */
export interface FilterState {
  teacher: string;
  durationMin: number | null;
  durationMax: number | null;
  dateFrom: string;
  dateTo: string;
  subject: string;
  status: LectureStatus | 'all';
}

/** Sort options */
export type SortOption =
  | 'newest'
  | 'oldest'
  | 'duration_high'
  | 'duration_low'
  | 'alphabetical';

/** Active view in the sidebar */
export type ActiveView = 'all' | 'bookmarks' | 'folders' | 'dashboard';

/** Messages between content script, inject script, and background */
export interface InterceptMessage {
  type: 'CLASSPLUS_LECTURES_INTERCEPTED';
  payload: {
    lectures: RawLecture[];
    totalCount: number;
    courseId: string;
  };
}

export interface BackgroundMessage {
  type: 'LECTURES_RECEIVED' | 'TOGGLE_SIDEBAR' | 'GET_LECTURES' | 'GET_USER_DATA' | 'SAVE_USER_DATA';
  payload?: unknown;
}

/** Default filter state */
export const DEFAULT_FILTERS: FilterState = {
  teacher: '',
  durationMin: null,
  durationMax: null,
  dateFrom: '',
  dateTo: '',
  subject: '',
  status: 'all',
};

/** Pre-defined subject tags */
export const PRESET_TAGS = [
  'English',
  'CDP',
  'EVS',
  'Reasoning',
  'Math',
  'Pedagogy',
  'Bengali',
  'Hindi',
  'Science',
  'Social Studies',
  'Current Affairs',
  'Practice Set',
];

/** Status display config */
export const STATUS_CONFIG: Record<LectureStatus, { label: string; icon: string; color: string }> = {
  not_started: { label: 'Not Started', icon: '⬜', color: '#64748B' },
  watching: { label: 'Watching', icon: '🔄', color: '#F59E0B' },
  completed: { label: 'Completed', icon: '✅', color: '#10B981' },
  revise_later: { label: 'Revise Later', icon: '📌', color: '#7C3AED' },
};
