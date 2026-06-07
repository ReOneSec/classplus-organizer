// ============================================================
// ClassPlus Organizer — BookmarkView Component
// ============================================================

import { useLectureStore } from '@/store/lectureStore';
import { LectureCard } from './LectureCard';
import { EmptyState } from './EmptyState';

export function BookmarkView() {
  const filteredLectures = useLectureStore((s) => s.filteredLectures);

  if (filteredLectures.length === 0) {
    return <EmptyState type="no_bookmarks" />;
  }

  return (
    <div className="h-full overflow-y-auto px-3 pb-4">
      <div className="sticky top-0 z-10 py-2 bg-cp-bg-primary/90 backdrop-blur-sm">
        <p className="text-[11px] text-cp-text-muted">
          ⭐ {filteredLectures.length} bookmarked lecture{filteredLectures.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="space-y-2">
        {filteredLectures.map((lecture, index) => (
          <LectureCard key={lecture.id} lecture={lecture} index={index} />
        ))}
      </div>
    </div>
  );
}
