// ============================================================
// ClassPlus Organizer — FolderView Component
// ============================================================

import { useState } from 'react';
import { useLectureStore } from '@/store/lectureStore';
import { LectureCard } from './LectureCard';
import { EmptyState } from './EmptyState';
import type { FolderCollection } from '@/types/lecture';

export function FolderView() {
  const folders = useLectureStore((s) => s.userData.folders);
  const selectedFolderId = useLectureStore((s) => s.selectedFolderId);
  const setSelectedFolderId = useLectureStore((s) => s.setSelectedFolderId);
  const createFolder = useLectureStore((s) => s.createFolder);
  const deleteFolder = useLectureStore((s) => s.deleteFolder);
  const renameFolder = useLectureStore((s) => s.renameFolder);
  const filteredLectures = useLectureStore((s) => s.filteredLectures);
  const enrichedLectures = useLectureStore((s) => s.enrichedLectures);

  const [newFolderName, setNewFolderName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = () => {
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim());
    setNewFolderName('');
    setShowCreate(false);
  };

  const handleRename = (folderId: string) => {
    if (!editName.trim()) return;
    renameFolder(folderId, editName.trim());
    setEditingFolder(null);
  };

  const startEdit = (folder: FolderCollection) => {
    setEditingFolder(folder.id);
    setEditName(folder.name);
  };

  // If a folder is selected, show its contents
  if (selectedFolderId) {
    const folder = folders.find((f) => f.id === selectedFolderId);
    if (!folder) return null;

    return (
      <div className="h-full overflow-y-auto px-3 pb-4">
        {/* Folder header */}
        <div className="sticky top-0 z-10 py-2 bg-cp-bg-primary/90 backdrop-blur-sm flex items-center gap-2">
          <button
            onClick={() => setSelectedFolderId(null)}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-elevated transition-all cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ background: folder.color }}
          />
          <span className="text-sm font-semibold text-cp-text-primary">{folder.name}</span>
          <span className="text-[11px] text-cp-text-muted ml-auto">
            {filteredLectures.length} lecture{filteredLectures.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredLectures.length === 0 ? (
          <EmptyState type="empty_folder" />
        ) : (
          <div className="space-y-2">
            {filteredLectures.map((lecture, index) => (
              <LectureCard key={lecture.id} lecture={lecture} index={index} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Folder list view
  return (
    <div className="h-full overflow-y-auto px-3 pb-4">
      <div className="sticky top-0 z-10 py-2 bg-cp-bg-primary/90 backdrop-blur-sm flex items-center justify-between">
        <p className="text-[11px] text-cp-text-muted">
          📁 {folders.length} folder{folders.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary text-[10px] px-2.5 py-1 flex items-center gap-1"
        >
          <span>+</span> New Folder
        </button>
      </div>

      {/* Create folder input */}
      {showCreate && (
        <div className="glass rounded-xl p-3 mb-2 animate-fade-in">
          <div className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Folder name..."
              className="input-field text-xs py-1.5 flex-1"
              autoFocus
              maxLength={30}
            />
            <button onClick={handleCreate} className="btn-primary text-[10px] px-3 py-1">
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="btn-secondary text-[10px] px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Folder cards */}
      {folders.length === 0 && !showCreate ? (
        <EmptyState type="no_folders" />
      ) : (
        <div className="space-y-2">
          {folders.map((folder) => {
            const lectureCount = folder.lectureIds.length;
            const previewLectures = folder.lectureIds
              .slice(0, 3)
              .map((id) => enrichedLectures.find((l) => l.id === id))
              .filter(Boolean);

            return (
              <div
                key={folder.id}
                className="glass rounded-xl p-3 glass-hover cursor-pointer transition-all duration-200 hover:shadow-card-hover group"
                onClick={() => setSelectedFolderId(folder.id)}
              >
                <div className="flex items-center gap-3">
                  {/* Folder icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${folder.color}20`, color: folder.color }}
                  >
                    📁
                  </div>

                  {/* Folder info */}
                  <div className="flex-1 min-w-0">
                    {editingFolder === folder.id ? (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(folder.id)}
                          className="input-field text-xs py-1 flex-1"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRename(folder.id)}
                          className="text-xs text-cp-success hover:underline cursor-pointer"
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-sm font-semibold text-cp-text-primary truncate">
                          {folder.name}
                        </h4>
                        <p className="text-[10px] text-cp-text-muted">
                          {lectureCount} lecture{lectureCount !== 1 ? 's' : ''}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Preview thumbnails */}
                  <div className="flex -space-x-2">
                    {previewLectures.map((l) => (
                      <div
                        key={l!.id}
                        className="w-8 h-8 rounded-md overflow-hidden border-2 border-cp-bg-secondary bg-cp-bg-elevated"
                      >
                        <img
                          src={l!.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div
                    className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => startEdit(folder)}
                      className="w-6 h-6 flex items-center justify-center rounded text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-elevated text-[10px] cursor-pointer"
                      title="Rename"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete folder "${folder.name}"?`)) {
                          deleteFolder(folder.id);
                        }
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded text-cp-text-muted hover:text-cp-danger hover:bg-cp-danger-bg text-[10px] cursor-pointer"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
