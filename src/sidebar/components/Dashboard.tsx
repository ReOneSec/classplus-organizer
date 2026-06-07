// ============================================================
// ClassPlus Organizer — Dashboard Component
// ============================================================

import { useEffect, useState } from 'react';
import { useLectureStore } from '@/store/lectureStore';
import { formatDurationHuman } from '@/utils/parser';

interface AnimatedCounterProps {
  target: number;
  duration?: number;
}

function AnimatedCounter({ target, duration = 600 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{count}</span>;
}

function DonutChart({ completed, total }: { completed: number; total: number }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {/* Background circle */}
        <circle
          cx="50" cy="50" r="42"
          fill="none"
          stroke="rgba(45, 45, 74, 0.5)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="50" cy="50" r="42"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold gradient-text">{percentage}%</span>
        <span className="text-[9px] text-cp-text-muted">Complete</span>
      </div>
    </div>
  );
}

export function Dashboard() {
  const enrichedLectures = useLectureStore((s) => s.enrichedLectures);
  const userData = useLectureStore((s) => s.userData);
  const setActiveView = useLectureStore((s) => s.setActiveView);
  const setFilters = useLectureStore((s) => s.setFilters);

  const totalCaptured = enrichedLectures.length;
  const totalCount = Math.max(userData.totalCount, totalCaptured);
  const completed = enrichedLectures.filter((l) => l.status === 'completed').length;
  const watching = enrichedLectures.filter((l) => l.status === 'watching').length;
  const reviseLater = enrichedLectures.filter((l) => l.status === 'revise_later').length;
  const bookmarked = userData.bookmarks.length;
  const pending = totalCaptured - completed - watching;

  // Teacher stats
  const teacherStats = enrichedLectures.reduce<Record<string, number>>((acc, l) => {
    acc[l.teacher] = (acc[l.teacher] || 0) + 1;
    return acc;
  }, {});
  const sortedTeachers = Object.entries(teacherStats).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxTeacherCount = sortedTeachers[0]?.[1] || 1;

  // Total watch time
  const totalSeconds = enrichedLectures.reduce((sum, l) => sum + l.durationSeconds, 0);

  // Navigate to filtered view
  const goToFiltered = (status: string) => {
    setActiveView('all');
    if (status === 'bookmarks') {
      setActiveView('bookmarks');
    } else if (status !== 'all') {
      setFilters({ status: status as 'not_started' | 'watching' | 'completed' | 'revise_later' });
      setActiveView('all');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
      {/* Completion donut */}
      <div className="glass rounded-2xl p-4 text-center">
        <h3 className="text-[10px] uppercase tracking-wider text-cp-text-muted font-semibold mb-3">
          Progress Overview
        </h3>
        <DonutChart completed={completed} total={totalCaptured} />
        <p className="text-xs text-cp-text-secondary mt-3">
          <span className="font-semibold text-cp-text-primary">{completed}</span> of{' '}
          <span className="font-semibold text-cp-text-primary">{totalCaptured}</span> lectures completed
        </p>
        {totalCount > totalCaptured && (
          <p className="text-[10px] text-cp-text-muted mt-1">
            {totalCount} total in course · {totalCaptured} captured
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => goToFiltered('all')} className="stat-card text-left cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📚</span>
            <span className="text-[10px] text-cp-text-muted uppercase tracking-wider">Total</span>
          </div>
          <p className="text-xl font-bold text-cp-text-primary">
            <AnimatedCounter target={totalCaptured} />
          </p>
        </button>

        <button onClick={() => goToFiltered('completed')} className="stat-card text-left cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">✅</span>
            <span className="text-[10px] text-cp-text-muted uppercase tracking-wider">Done</span>
          </div>
          <p className="text-xl font-bold text-cp-success">
            <AnimatedCounter target={completed} />
          </p>
        </button>

        <button onClick={() => goToFiltered('not_started')} className="stat-card text-left cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">⏳</span>
            <span className="text-[10px] text-cp-text-muted uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-xl font-bold text-cp-text-primary">
            <AnimatedCounter target={pending} />
          </p>
        </button>

        <button onClick={() => goToFiltered('bookmarks')} className="stat-card text-left cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">⭐</span>
            <span className="text-[10px] text-cp-text-muted uppercase tracking-wider">Starred</span>
          </div>
          <p className="text-xl font-bold text-yellow-400">
            <AnimatedCounter target={bookmarked} />
          </p>
        </button>

        <button onClick={() => goToFiltered('watching')} className="stat-card text-left cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔄</span>
            <span className="text-[10px] text-cp-text-muted uppercase tracking-wider">Watching</span>
          </div>
          <p className="text-xl font-bold text-cp-warning">
            <AnimatedCounter target={watching} />
          </p>
        </button>

        <button onClick={() => goToFiltered('revise_later')} className="stat-card text-left cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📌</span>
            <span className="text-[10px] text-cp-text-muted uppercase tracking-wider">Revise</span>
          </div>
          <p className="text-xl font-bold text-cp-accent-light">
            <AnimatedCounter target={reviseLater} />
          </p>
        </button>
      </div>

      {/* Total watch time */}
      <div className="glass rounded-2xl p-4">
        <h3 className="text-[10px] uppercase tracking-wider text-cp-text-muted font-semibold mb-2">
          Total Content Duration
        </h3>
        <p className="text-lg font-bold gradient-text">
          {formatDurationHuman(totalSeconds)}
        </p>
        <p className="text-[10px] text-cp-text-muted mt-0.5">
          across {totalCaptured} lectures
        </p>
      </div>

      {/* Teacher breakdown */}
      {sortedTeachers.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <h3 className="text-[10px] uppercase tracking-wider text-cp-text-muted font-semibold mb-3">
            Teachers
          </h3>
          <div className="space-y-2.5">
            {sortedTeachers.map(([teacher, count]) => (
              <div key={teacher}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-cp-text-secondary truncate mr-2">{teacher}</span>
                  <span className="text-[10px] text-cp-text-muted flex-shrink-0">{count}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-cp-bg-elevated overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${(count / maxTeacherCount) * 100}%`,
                      background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
