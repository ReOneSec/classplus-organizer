// ============================================================
// ClassPlus Organizer — RevisionStatus Component
// ============================================================

import { useLectureStore } from '@/store/lectureStore';
import { STATUS_CONFIG } from '@/types/lecture';
import type { LectureStatus } from '@/types/lecture';

interface Props {
  lectureId: number;
  currentStatus: LectureStatus;
  onClose: () => void;
}

const STATUSES: LectureStatus[] = ['not_started', 'watching', 'completed', 'revise_later'];

export function RevisionStatus({ lectureId, currentStatus, onClose }: Props) {
  const setLectureStatus = useLectureStore((s) => s.setLectureStatus);

  const handleSelect = (status: LectureStatus) => {
    setLectureStatus(lectureId, status);
    onClose();
  };

  return (
    <div className="glass rounded-xl py-1.5 min-w-[170px] shadow-elevated">
      <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-cp-text-muted font-semibold">
        Revision Status
      </p>
      {STATUSES.map((status) => {
        const config = STATUS_CONFIG[status];
        const isActive = status === currentStatus;
        return (
          <button
            key={status}
            onClick={() => handleSelect(status)}
            className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-all cursor-pointer ${
              isActive
                ? 'text-cp-text-primary bg-cp-bg-elevated'
                : 'text-cp-text-secondary hover:text-cp-text-primary hover:bg-cp-bg-elevated'
            }`}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
            {isActive && <span className="ml-auto text-cp-accent">●</span>}
          </button>
        );
      })}
    </div>
  );
}
