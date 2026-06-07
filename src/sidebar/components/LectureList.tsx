// ============================================================
// ClassPlus Organizer — LectureList Component
// ============================================================

import { useRef, useState, useEffect, useCallback } from 'react';
import { useLectureStore } from '@/store/lectureStore';
import { LectureCard } from './LectureCard';
import { EmptyState } from './EmptyState';

const PAGE_SIZE = 30;

export function LectureList() {
  const filteredLectures = useLectureStore((s) => s.filteredLectures);
  const searchQuery = useLectureStore((s) => s.searchQuery);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset visible count on filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [filteredLectures.length, searchQuery]);

  // Intersection observer for infinite scroll
  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredLectures.length));
  }, [filteredLectures.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, root: scrollRef.current }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  const visibleLectures = filteredLectures.slice(0, visibleCount);
  const hasMore = visibleCount < filteredLectures.length;

  if (filteredLectures.length === 0) {
    return (
      <EmptyState
        type={searchQuery ? 'no_results' : 'no_lectures'}
        query={searchQuery}
      />
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-3 pb-4">
      {/* Result count */}
      <div className="sticky top-0 z-10 py-2 bg-cp-bg-primary/90 backdrop-blur-sm">
        <p className="text-[11px] text-cp-text-muted">
          Showing {visibleLectures.length} of {filteredLectures.length} lectures
        </p>
      </div>

      {/* Lecture cards */}
      <div className="space-y-2">
        {visibleLectures.map((lecture, index) => (
          <LectureCard key={lecture.id} lecture={lecture} index={index} />
        ))}
      </div>

      {/* Load more sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="py-4 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-cp-text-muted">
            <div className="w-4 h-4 rounded-full border-2 border-cp-accent border-t-transparent animate-spin" />
            Loading more...
          </div>
        </div>
      )}
    </div>
  );
}
