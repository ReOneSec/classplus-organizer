// ============================================================
// ClassPlus Organizer — API Response Parser
// ============================================================

import type { RawLecture, Lecture } from '@/types/lecture';

/**
 * Parse a duration string like "01:20:26" to total seconds.
 */
export function parseDuration(duration: string): number {
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

/**
 * Format seconds back to "HH:MM:SS" or "MM:SS".
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Format seconds to a human-readable string like "1h 20m".
 */
export function formatDurationHuman(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Extract teacher name from "by HOSROT ALI SIR" style string.
 */
export function parseTeacherName(createdByText: string): string {
  return (createdByText || '')
    .replace(/^by\s+/i, '')
    .trim();
}

/**
 * Parse date from ClassPlus format " 2026/01/28" to ISO string.
 */
export function parseDate(dateText: string): string {
  const cleaned = dateText.trim();
  // Format: "2026/01/28" or "On: 2026/01/28"
  const match = cleaned.match(/(\d{4})\/(\d{2})\/(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return cleaned;
}

/**
 * Parse date to timestamp for sorting.
 */
export function parseDateTimestamp(dateText: string): number {
  const iso = parseDate(dateText);
  const ts = new Date(iso).getTime();
  return isNaN(ts) ? 0 : ts;
}

/**
 * Parse a raw lecture from the API into our normalized format.
 */
export function parseLecture(raw: RawLecture, courseId: string): Lecture {
  return {
    id: raw.id,
    name: raw.name,
    teacher: parseTeacherName(raw.tutorName || raw.createdByText),
    duration: raw.duration,
    durationSeconds: parseDuration(raw.duration),
    date: parseDate(raw.createdAtText || raw.createdAt),
    dateTimestamp: parseDateTimestamp(raw.createdAtText || raw.createdAt),
    thumbnailUrl: raw.thumbnailUrl,
    contentHashId: raw.contentHashId,
    liveSessionId: raw.liveSessionId,
    videoType: raw.videoType,
    vidKey: raw.vidKey,
    isLocked: raw.isLocked === 1,
    courseId,
  };
}

/**
 * Parse an array of raw lectures.
 */
export function parseLectures(rawLectures: RawLecture[], courseId: string): Lecture[] {
  return rawLectures.map((raw) => parseLecture(raw, courseId));
}

/**
 * Extract course ID from a recordings API URL.
 */
export function extractCourseId(url: string): string {
  const match = url.match(/entityId=(\d+)/);
  return match ? match[1] : 'unknown';
}

/**
 * Format a date string for display.
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get unique teachers from a list of lectures.
 */
export function getUniqueTeachers(lectures: Lecture[]): string[] {
  const teachers = new Set(lectures.map((l) => l.teacher));
  return Array.from(teachers).sort();
}
