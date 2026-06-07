// ============================================================
// ClassPlus Organizer — QuickNav Component
// ============================================================

import { useState } from 'react';
import { useLectureStore } from '@/store/lectureStore';

export function QuickNav() {
  const [showJumpInput, setShowJumpInput] = useState(false);
  const [jumpNumber, setJumpNumber] = useState('');
  const filteredLectures = useLectureStore((s) => s.filteredLectures);
  const setSortBy = useLectureStore((s) => s.setSortBy);

  const total = filteredLectures.length;

  const scrollToIndex = (index: number) => {
    // First sort by oldest so lecture numbers make sense
    setSortBy('oldest');

    // Scroll to the card at the given index
    setTimeout(() => {
      const container = document.querySelector('.overflow-y-auto');
      if (!container) return;
      const cards = container.querySelectorAll('[class*="glass rounded-xl p-3"]');
      const target = cards[Math.min(index, cards.length - 1)];
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Flash effect
        target.classList.add('ring-2', 'ring-cp-accent');
        setTimeout(() => target.classList.remove('ring-2', 'ring-cp-accent'), 2000);
      }
    }, 100);
  };

  const handleJump = () => {
    const num = parseInt(jumpNumber);
    if (isNaN(num) || num < 1) return;
    scrollToIndex(num - 1);
    setJumpNumber('');
    setShowJumpInput(false);
  };

  if (total === 0) return null;

  return (
    <div className="flex-shrink-0 px-3 py-2 border-t border-cp-border bg-cp-bg-primary/95 backdrop-blur-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-cp-text-muted mr-1">Jump:</span>

        <button
          onClick={() => scrollToIndex(0)}
          className="btn-secondary text-[10px] px-2 py-1 cursor-pointer"
          title="First lecture"
        >
          First
        </button>

        {total >= 50 && (
          <button
            onClick={() => scrollToIndex(49)}
            className="btn-secondary text-[10px] px-2 py-1 cursor-pointer"
          >
            #50
          </button>
        )}

        {total >= 100 && (
          <button
            onClick={() => scrollToIndex(99)}
            className="btn-secondary text-[10px] px-2 py-1 cursor-pointer"
          >
            #100
          </button>
        )}

        <button
          onClick={() => scrollToIndex(total - 1)}
          className="btn-secondary text-[10px] px-2 py-1 cursor-pointer"
          title="Latest lecture"
        >
          Latest
        </button>

        <div className="ml-auto">
          {showJumpInput ? (
            <div className="flex gap-1 items-center">
              <input
                type="number"
                value={jumpNumber}
                onChange={(e) => setJumpNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJump()}
                placeholder="#"
                className="input-field text-[10px] py-1 px-2 w-14"
                min="1"
                max={total}
                autoFocus
              />
              <button onClick={handleJump} className="btn-primary text-[10px] px-2 py-1">
                Go
              </button>
              <button
                onClick={() => setShowJumpInput(false)}
                className="text-cp-text-muted hover:text-cp-text-primary text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowJumpInput(true)}
              className="btn-secondary text-[10px] px-2 py-1 cursor-pointer"
              title="Jump to lecture number"
            >
              Go to #
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
