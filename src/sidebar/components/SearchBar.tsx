// ============================================================
// ClassPlus Organizer — SearchBar Component
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLectureStore } from '@/store/lectureStore';

export function SearchBar() {
  const searchQuery = useLectureStore((s) => s.searchQuery);
  const setSearchQuery = useLectureStore((s) => s.setSearchQuery);
  const filteredLectures = useLectureStore((s) => s.filteredLectures);
  const lectures = useLectureStore((s) => s.lectures);

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  // Sync external changes
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Debounced search
  const handleChange = useCallback(
    (value: string) => {
      setLocalQuery(value);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        setSearchQuery(value);
      }, 150);
    },
    [setSearchQuery]
  );

  // Keyboard shortcut: Ctrl+K to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        handleChange('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleChange]);

  const handleClear = () => {
    handleChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative group">
      {/* Search icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cp-text-muted group-focus-within:text-cp-accent transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={localQuery}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search lectures, teachers, topics..."
        className="input-field pl-9 pr-20"
        id="search-input"
      />

      {/* Right side: result count + clear + shortcut */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {localQuery && (
          <>
            <span className="text-[10px] text-cp-text-muted">
              {filteredLectures.length}/{lectures.length}
            </span>
            <button
              onClick={handleClear}
              className="w-5 h-5 flex items-center justify-center rounded text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-elevated transition-all cursor-pointer"
              aria-label="Clear search"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </>
        )}
        {!localQuery && (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-cp-text-muted bg-cp-bg-elevated border border-cp-border">
            Ctrl+K
          </kbd>
        )}
      </div>
    </div>
  );
}
