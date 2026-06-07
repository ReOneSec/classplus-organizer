// ============================================================
// ClassPlus Organizer — Sidebar Root Component
// ============================================================

import { useEffect } from 'react';
import { useLectureStore } from '@/store/lectureStore';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { LectureList } from './components/LectureList';
import { ContinueWatching } from './components/ContinueWatching';
import { BookmarkView } from './components/BookmarkView';
import { FolderView } from './components/FolderView';
import { Dashboard } from './components/Dashboard';
import { QuickNav } from './components/QuickNav';

export function Sidebar() {
  const initialize = useLectureStore((s) => s.initialize);
  const activeView = useLectureStore((s) => s.activeView);
  const isLoading = useLectureStore((s) => s.isLoading);
  const lectures = useLectureStore((s) => s.lectures);

  useEffect(() => {
    initialize();

    // Listen for storage changes (new lectures intercepted)
    const handleStorageChange = () => {
      initialize();
    };

    // Poll for updates every 5 seconds (lightweight)
    const interval = setInterval(handleStorageChange, 5000);

    return () => clearInterval(interval);
  }, [initialize]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-cp-bg-primary">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full gradient-accent animate-pulse" />
            <p className="text-cp-text-secondary text-sm animate-fade-in">
              Loading your lectures...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-cp-bg-primary">
      <Header />

      {activeView === 'dashboard' ? (
        <Dashboard />
      ) : (
        <>
          {/* Search & Filters */}
          <div className="px-4 pt-3 pb-1 space-y-2">
            <SearchBar />
            <FilterPanel />
          </div>

          {/* Continue Watching (only on "all" view) */}
          {activeView === 'all' && lectures.length > 0 && (
            <ContinueWatching />
          )}

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden">
            {activeView === 'all' && <LectureList />}
            {activeView === 'bookmarks' && <BookmarkView />}
            {activeView === 'folders' && <FolderView />}
          </div>

          {/* Quick Navigation */}
          {activeView !== 'folders' && <QuickNav />}
        </>
      )}
    </div>
  );
}
