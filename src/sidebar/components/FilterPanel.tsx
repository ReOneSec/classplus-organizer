// ============================================================
// ClassPlus Organizer — FilterPanel Component
// ============================================================

import { useState } from 'react';
import { useLectureStore } from '@/store/lectureStore';
import type { SortOption, LectureStatus } from '@/types/lecture';

const DURATION_PRESETS = [
  { label: '< 30m', min: 0, max: 1800 },
  { label: '30-60m', min: 1800, max: 3600 },
  { label: '60m+', min: 3600, max: null },
];

const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: 'newest', label: 'Newest First', icon: '🕐' },
  { value: 'oldest', label: 'Oldest First', icon: '📅' },
  { value: 'duration_high', label: 'Longest', icon: '⏱️' },
  { value: 'duration_low', label: 'Shortest', icon: '⚡' },
  { value: 'alphabetical', label: 'A → Z', icon: '🔤' },
];

const STATUS_OPTIONS: { value: LectureStatus | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'not_started', label: 'Not Started', icon: '⬜' },
  { value: 'watching', label: 'Watching', icon: '🔄' },
  { value: 'completed', label: 'Completed', icon: '✅' },
  { value: 'revise_later', label: 'Revise Later', icon: '📌' },
];

export function FilterPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const filters = useLectureStore((s) => s.filters);
  const setFilters = useLectureStore((s) => s.setFilters);
  const resetFilters = useLectureStore((s) => s.resetFilters);
  const sortBy = useLectureStore((s) => s.sortBy);
  const setSortBy = useLectureStore((s) => s.setSortBy);
  const teachers = useLectureStore((s) => s.teachers);

  const hasActiveFilters =
    filters.teacher ||
    filters.durationMin !== null ||
    filters.durationMax !== null ||
    filters.status !== 'all' ||
    filters.subject;

  const activeDurationPreset = DURATION_PRESETS.findIndex(
    (p) => p.min === filters.durationMin && p.max === filters.durationMax
  );

  const handleDurationClick = (idx: number) => {
    if (activeDurationPreset === idx) {
      setFilters({ durationMin: null, durationMax: null });
    } else {
      setFilters({
        durationMin: DURATION_PRESETS[idx].min,
        durationMax: DURATION_PRESETS[idx].max,
      });
    }
  };

  return (
    <div className="space-y-2">
      {/* Toggle bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs text-cp-text-secondary hover:text-cp-text-primary transition-colors cursor-pointer"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-cp-accent animate-pulse" />
          )}
        </button>

        {/* Sort dropdown */}
        <div className="ml-auto flex items-center gap-1.5">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-[11px] bg-cp-bg-elevated text-cp-text-secondary border border-cp-border rounded-md px-2 py-1 outline-none focus:border-cp-accent cursor-pointer appearance-none"
            style={{ backgroundImage: 'none' }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="glass rounded-xl p-3 space-y-3 animate-fade-in">
          {/* Teacher filter */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-cp-text-muted font-semibold mb-1.5 block">
              Teacher
            </label>
            <select
              value={filters.teacher}
              onChange={(e) => setFilters({ teacher: e.target.value })}
              className="input-field text-xs py-1.5 cursor-pointer"
            >
              <option value="">All Teachers</option>
              {teachers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Duration chips */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-cp-text-muted font-semibold mb-1.5 block">
              Duration
            </label>
            <div className="flex gap-1.5">
              {DURATION_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDurationClick(idx)}
                  className={`chip cursor-pointer ${activeDurationPreset === idx ? 'active' : ''}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-cp-text-muted font-semibold mb-1.5 block">
              Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilters({ status: opt.value })}
                  className={`chip cursor-pointer ${filters.status === opt.value ? 'active' : ''}`}
                >
                  <span className="mr-1">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-cp-danger hover:text-red-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
