// ============================================================
// ClassPlus Organizer — Fuse.js Search Engine
// ============================================================

import Fuse, { type IFuseOptions } from 'fuse.js';
import type { LectureWithUserData } from '@/types/lecture';

/** Fuse.js configuration optimized for lecture search */
const FUSE_OPTIONS: IFuseOptions<LectureWithUserData> = {
  keys: [
    { name: 'name', weight: 2.0 },
    { name: 'teacher', weight: 1.0 },
    { name: 'tags', weight: 0.5 },
  ],
  threshold: 0.35,
  distance: 100,
  minMatchCharLength: 2,
  includeScore: true,
  shouldSort: true,
  findAllMatches: true,
  ignoreLocation: true,
};

let fuseInstance: Fuse<LectureWithUserData> | null = null;

/**
 * Build (or rebuild) the Fuse.js search index.
 */
export function buildSearchIndex(lectures: LectureWithUserData[]): void {
  fuseInstance = new Fuse(lectures, FUSE_OPTIONS);
}

/**
 * Search lectures using Fuse.js fuzzy search.
 * Returns matching lecture IDs in ranked order.
 */
export function searchLectures(query: string): Set<number> {
  if (!fuseInstance || !query.trim()) {
    return new Set();
  }

  const results = fuseInstance.search(query.trim());
  return new Set(results.map((r) => r.item.id));
}

/**
 * Get the Fuse.js instance for advanced usage.
 */
export function getFuseInstance(): Fuse<LectureWithUserData> | null {
  return fuseInstance;
}
