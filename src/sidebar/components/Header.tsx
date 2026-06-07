// ============================================================
// ClassPlus Organizer — Header Component
// ============================================================

import { useLectureStore } from '@/store/lectureStore';
import type { ActiveView } from '@/types/lecture';

const TABS: { id: ActiveView; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '📚' },
  { id: 'bookmarks', label: 'Starred', icon: '⭐' },
  { id: 'folders', label: 'Folders', icon: '📁' },
  { id: 'dashboard', label: 'Stats', icon: '📊' },
];

export function Header() {
  const activeView = useLectureStore((s) => s.activeView);
  const setActiveView = useLectureStore((s) => s.setActiveView);
  const lectures = useLectureStore((s) => s.lectures);

  return (
    <header className="flex-shrink-0">
      {/* Branding */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center shadow-glow">
            <span className="text-white text-sm font-bold">C+</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-cp-text-primary leading-tight">
              ClassPlus Organizer
            </h1>
            <p className="text-[10px] text-cp-text-muted leading-tight">
              {lectures.length > 0
                ? `${lectures.length} lectures captured`
                : 'Browse a course to start'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <nav className="px-2 flex gap-0.5 border-b border-cp-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`
              tab-indicator flex-1 flex items-center justify-center gap-1.5
              py-2.5 px-2 text-xs font-medium rounded-t-lg
              transition-all duration-200 cursor-pointer
              ${
                activeView === tab.id
                  ? 'active text-cp-text-primary bg-cp-bg-secondary/50'
                  : 'text-cp-text-muted hover:text-cp-text-secondary hover:bg-cp-bg-secondary/30'
              }
            `}
          >
            <span className="text-sm">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
}
