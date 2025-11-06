import React from 'react';

export type ForumView = 'discussion' | 'ai';

interface ForumFilterProps {
  currentView: ForumView;
  onViewChange: (view: ForumView) => void;
}

const ForumFilter: React.FC<ForumFilterProps> = ({ currentView, onViewChange }) => {
  const baseClasses = "px-6 py-2 text-sm font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const activeClasses = "bg-red-800 text-white shadow";
  const inactiveClasses = "bg-white text-gray-700 hover:bg-gray-100";

  return (
    <div className="flex justify-center p-1 bg-gray-200 rounded-full mb-6 max-w-sm mx-auto">
      <button
        onClick={() => onViewChange('discussion')}
        className={`${baseClasses} ${currentView === 'discussion' ? activeClasses : inactiveClasses} focus:ring-red-500`}
        aria-pressed={currentView === 'discussion'}
      >
        Discussions
      </button>
      <button
        onClick={() => onViewChange('ai')}
        className={`${baseClasses} ${currentView === 'ai' ? activeClasses : inactiveClasses} focus:ring-red-500`}
        aria-pressed={currentView === 'ai'}
      >
        Get Answers
      </button>
    </div>
  );
};

export default ForumFilter;
