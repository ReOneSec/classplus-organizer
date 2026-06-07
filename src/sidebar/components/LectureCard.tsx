// ============================================================
// ClassPlus Organizer — LectureCard Component
// ============================================================

import { useState, useRef } from 'react';
import { useLectureStore } from '@/store/lectureStore';
import { formatDurationHuman, formatDate } from '@/utils/parser';
import { TagManager } from './TagManager';
import { RevisionStatus } from './RevisionStatus';
import type { LectureWithUserData, FolderCollection } from '@/types/lecture';

interface Props {
  lecture: LectureWithUserData;
  index: number;
}

export function LectureCard({ lecture, index }: Props) {
  const toggleBookmark = useLectureStore((s) => s.toggleBookmark);
  const markOpened = useLectureStore((s) => s.markOpened);
  const addToFolder = useLectureStore((s) => s.addToFolder);
  const folders = useLectureStore((s) => s.userData.folders);

  const [showMenu, setShowMenu] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [starAnimating, setStarAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStarAnimating(true);
    toggleBookmark(lecture.id);
    setTimeout(() => setStarAnimating(false), 400);
  };

  const handleClick = () => {
    markOpened(lecture.id);
    // Navigate to the lecture on ClassPlus
    // The contentHashId can be used to construct the lecture URL
    // For now, we just mark it as opened
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(!showMenu);
  };

  const handleFolderAdd = (folder: FolderCollection) => {
    addToFolder(folder.id, lecture.id);
    setShowFolderPicker(false);
    setShowMenu(false);
  };

  return (
    <div
      ref={cardRef}
      className="group relative glass rounded-xl p-3 glass-hover cursor-pointer animate-fade-in transition-all duration-200 hover:shadow-card-hover hover:translate-y-[-1px]"
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="flex-shrink-0 relative w-24 h-16 rounded-lg overflow-hidden bg-cp-bg-elevated">
          <img
            src={lecture.thumbnailUrl}
            alt={lecture.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '';
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Duration badge */}
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-black/70 text-white backdrop-blur-sm">
            {formatDurationHuman(lecture.durationSeconds)}
          </div>
          {/* Locked indicator */}
          {lecture.isLocked && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-lg">🔒</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className="text-[13px] font-semibold text-cp-text-primary leading-tight line-clamp-2 group-hover:text-cp-accent-light transition-colors"
            title={lecture.name}
          >
            {lecture.name}
          </h3>

          {/* Teacher */}
          <p className="text-[11px] text-cp-text-muted mt-0.5 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {lecture.teacher}
          </p>

          {/* Date */}
          <p className="text-[10px] text-cp-text-muted mt-0.5">
            {formatDate(lecture.date)}
          </p>

          {/* Tags */}
          {lecture.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {lecture.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-cp-accent/15 text-cp-accent-light border border-cp-accent/20"
                >
                  {tag}
                </span>
              ))}
              {lecture.tags.length > 3 && (
                <span className="text-[9px] text-cp-text-muted">
                  +{lecture.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          {/* Bookmark star */}
          <button
            onClick={handleBookmark}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
              lecture.bookmarked
                ? 'text-yellow-400 bg-yellow-400/10'
                : 'text-cp-text-muted hover:text-yellow-400 hover:bg-yellow-400/10'
            } ${starAnimating ? 'star-animate' : ''}`}
            title={lecture.bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {lecture.bookmarked ? '⭐' : '☆'}
          </button>

          {/* Status dot */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowStatusPicker(!showStatusPicker);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[11px] hover:bg-cp-bg-elevated transition-all cursor-pointer"
            title={`Status: ${lecture.status.replace('_', ' ')}`}
          >
            {lecture.status === 'not_started' && '⬜'}
            {lecture.status === 'watching' && '🔄'}
            {lecture.status === 'completed' && '✅'}
            {lecture.status === 'revise_later' && '📌'}
          </button>

          {/* More menu */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-elevated transition-all cursor-pointer opacity-0 group-hover:opacity-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Status picker dropdown */}
      {showStatusPicker && (
        <div className="absolute right-12 top-8 z-50 animate-scale-in" onClick={(e) => e.stopPropagation()}>
          <RevisionStatus
            lectureId={lecture.id}
            currentStatus={lecture.status}
            onClose={() => setShowStatusPicker(false)}
          />
        </div>
      )}

      {/* Context menu */}
      {showMenu && (
        <div
          className="absolute right-2 top-full mt-1 z-50 glass rounded-xl py-1.5 min-w-[180px] shadow-elevated animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-3 py-2 text-left text-xs text-cp-text-secondary hover:text-cp-text-primary hover:bg-cp-bg-elevated transition-all flex items-center gap-2 cursor-pointer"
            onClick={() => {
              setShowTagManager(true);
              setShowMenu(false);
            }}
          >
            <span>🏷️</span> Manage Tags
          </button>
          <button
            className="w-full px-3 py-2 text-left text-xs text-cp-text-secondary hover:text-cp-text-primary hover:bg-cp-bg-elevated transition-all flex items-center gap-2 cursor-pointer"
            onClick={() => {
              setShowFolderPicker(true);
              setShowMenu(false);
            }}
          >
            <span>📁</span> Add to Folder
          </button>
          <button
            className="w-full px-3 py-2 text-left text-xs text-cp-text-secondary hover:text-cp-text-primary hover:bg-cp-bg-elevated transition-all flex items-center gap-2 cursor-pointer"
            onClick={() => {
              setShowStatusPicker(true);
              setShowMenu(false);
            }}
          >
            <span>📊</span> Set Status
          </button>
          <div className="border-t border-cp-border my-1" />
          <button
            className="w-full px-3 py-2 text-left text-xs text-cp-text-secondary hover:text-cp-text-primary hover:bg-cp-bg-elevated transition-all flex items-center gap-2 cursor-pointer"
            onClick={() => setShowMenu(false)}
          >
            <span>✕</span> Close
          </button>
        </div>
      )}

      {/* Tag manager modal */}
      {showTagManager && (
        <div className="absolute left-0 top-full mt-1 z-50 animate-scale-in" onClick={(e) => e.stopPropagation()}>
          <TagManager
            lectureId={lecture.id}
            currentTags={lecture.tags}
            onClose={() => setShowTagManager(false)}
          />
        </div>
      )}

      {/* Folder picker */}
      {showFolderPicker && (
        <div
          className="absolute right-2 top-full mt-1 z-50 glass rounded-xl py-1.5 min-w-[180px] shadow-elevated animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-cp-text-muted font-semibold">
            Add to folder
          </p>
          {folders.length === 0 ? (
            <p className="px-3 py-2 text-xs text-cp-text-muted">No folders yet</p>
          ) : (
            folders.map((folder) => (
              <button
                key={folder.id}
                className="w-full px-3 py-2 text-left text-xs text-cp-text-secondary hover:text-cp-text-primary hover:bg-cp-bg-elevated transition-all flex items-center gap-2 cursor-pointer"
                onClick={() => handleFolderAdd(folder)}
              >
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ background: folder.color }}
                />
                {folder.name}
                {folder.lectureIds.includes(lecture.id) && (
                  <span className="ml-auto text-cp-success">✓</span>
                )}
              </button>
            ))
          )}
          <div className="border-t border-cp-border my-1" />
          <button
            className="w-full px-3 py-2 text-left text-xs text-cp-text-muted hover:text-cp-text-primary transition-all cursor-pointer"
            onClick={() => setShowFolderPicker(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Click outside handler */}
      {(showMenu || showFolderPicker) && (
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(false);
            setShowFolderPicker(false);
            setShowStatusPicker(false);
          }}
        />
      )}
    </div>
  );
}
