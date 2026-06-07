// ============================================================
// ClassPlus Organizer — TagManager Component
// ============================================================

import { useState } from 'react';
import { useLectureStore } from '@/store/lectureStore';
import { PRESET_TAGS } from '@/types/lecture';

interface Props {
  lectureId: number;
  currentTags: string[];
  onClose: () => void;
}

export function TagManager({ lectureId, currentTags, onClose }: Props) {
  const addTag = useLectureStore((s) => s.addTag);
  const removeTag = useLectureStore((s) => s.removeTag);
  const addCustomTag = useLectureStore((s) => s.addCustomTag);
  const customTags = useLectureStore((s) => s.userData.customTags);

  const [newTag, setNewTag] = useState('');

  const allTags = [...new Set([...PRESET_TAGS, ...customTags])];

  const handleToggle = (tag: string) => {
    if (currentTags.includes(tag)) {
      removeTag(lectureId, tag);
    } else {
      addTag(lectureId, tag);
    }
  };

  const handleAddCustom = () => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    addCustomTag(trimmed);
    addTag(lectureId, trimmed);
    setNewTag('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="glass rounded-xl p-3 min-w-[220px] shadow-elevated">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-cp-text-primary flex items-center gap-1.5">
          <span>🏷️</span> Subject Tags
        </h4>
        <button
          onClick={onClose}
          className="w-5 h-5 flex items-center justify-center rounded text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-elevated transition-all cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Tag grid */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {allTags.map((tag) => {
          const isActive = currentTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => handleToggle(tag)}
              className={`chip cursor-pointer text-[10px] ${isActive ? 'active' : ''}`}
            >
              {isActive && <span className="mr-0.5">✓</span>}
              {tag}
            </button>
          );
        })}
      </div>

      {/* Custom tag input */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Custom tag..."
          className="input-field text-xs py-1.5 flex-1"
          maxLength={20}
        />
        <button
          onClick={handleAddCustom}
          disabled={!newTag.trim()}
          className="btn-primary text-[10px] px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
    </div>
  );
}
