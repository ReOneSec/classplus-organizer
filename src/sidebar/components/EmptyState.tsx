// ============================================================
// ClassPlus Organizer — EmptyState Component
// ============================================================

interface Props {
  type: 'no_lectures' | 'no_results' | 'no_bookmarks' | 'no_folders' | 'empty_folder';
  query?: string;
}

const CONFIGS = {
  no_lectures: {
    icon: '📖',
    title: 'No lectures captured yet',
    description: 'Browse your ClassPlus course and lectures will appear here automatically as they load.',
    tip: 'Tip: Scroll through your course to capture more lectures.',
  },
  no_results: {
    icon: '🔍',
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
    tip: null,
  },
  no_bookmarks: {
    icon: '⭐',
    title: 'No bookmarks yet',
    description: 'Star your important lectures to find them quickly here.',
    tip: 'Tip: Click the ☆ icon on any lecture card to bookmark it.',
  },
  no_folders: {
    icon: '📁',
    title: 'No folders yet',
    description: 'Create folders to organize your lectures by topic, subject, or revision priority.',
    tip: 'Tip: Click "+ New Folder" above to get started.',
  },
  empty_folder: {
    icon: '📂',
    title: 'This folder is empty',
    description: 'Add lectures to this folder from the lecture card menu.',
    tip: 'Tip: Right-click a lecture card → "Add to Folder".',
  },
};

export function EmptyState({ type, query }: Props) {
  const config = CONFIGS[type];

  return (
    <div className="flex-1 flex items-center justify-center px-8 py-12">
      <div className="text-center max-w-[240px] animate-fade-in">
        {/* Icon */}
        <div className="text-4xl mb-4 animate-bounce-in">{config.icon}</div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-cp-text-primary mb-1.5">
          {config.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-cp-text-muted leading-relaxed">
          {type === 'no_results' && query
            ? `No lectures match "${query}". Try different keywords.`
            : config.description}
        </p>

        {/* Tip */}
        {config.tip && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-cp-accent/10 border border-cp-accent/20">
            <p className="text-[10px] text-cp-accent-light leading-relaxed">
              {config.tip}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
