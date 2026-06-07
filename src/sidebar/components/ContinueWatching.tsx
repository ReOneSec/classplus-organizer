// ============================================================
// ClassPlus Organizer — ContinueWatching Component
// ============================================================

import { useLectureStore } from '@/store/lectureStore';
import { formatDurationHuman } from '@/utils/parser';

export function ContinueWatching() {
  const enrichedLectures = useLectureStore((s) => s.enrichedLectures);
  const recentlyOpened = useLectureStore((s) => s.userData.recentlyOpened);
  const markOpened = useLectureStore((s) => s.markOpened);

  // Get recently opened lectures in order
  const recentLectures = recentlyOpened
    .map((id) => enrichedLectures.find((l) => l.id === id))
    .filter(Boolean)
    .slice(0, 10);

  if (recentLectures.length === 0) return null;

  return (
    <div className="px-4 py-2">
      <h3 className="text-[11px] uppercase tracking-wider text-cp-text-muted font-semibold mb-2 flex items-center gap-1.5">
        <span>🕐</span> Continue Watching
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {recentLectures.map((lecture) => (
          <button
            key={lecture!.id}
            className="flex-shrink-0 w-32 group cursor-pointer"
            onClick={() => markOpened(lecture!.id)}
          >
            {/* Thumbnail */}
            <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-cp-bg-elevated mb-1.5">
              <img
                src={lecture!.thumbnailUrl}
                alt={lecture!.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[8px] font-medium bg-black/70 text-white">
                {formatDurationHuman(lecture!.durationSeconds)}
              </div>
              {/* Play icon on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-cp-accent/90 flex items-center justify-center shadow-glow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>
            </div>
            {/* Title */}
            <p className="text-[10px] text-cp-text-secondary group-hover:text-cp-text-primary transition-colors leading-tight line-clamp-2 text-left">
              {lecture!.name}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
