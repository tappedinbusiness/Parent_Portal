import React from 'react';
import type { Question, StudentYear } from '../types';
import ForumItem from './ForumItem';

interface ForumDisplayProps {
  pinnedQuestions: Question[];
  yearSpecificQuestions: Question[];
  allQuestions: Question[];
  onToggleLike: (questionId: string) => void;
  onAddComment: (questionId: string, commentText: string) => void;
  likedIds: string[];
  likedCommentIds?: string[];
  onToggleCommentLike?: (commentId: string, questionId: string) => void;
  selectedYear: StudentYear | 'All';
  currentView: 'discussion' | 'ai';
}

const ForumDisplay: React.FC<ForumDisplayProps> = ({ pinnedQuestions, yearSpecificQuestions, allQuestions, onToggleLike, onAddComment, likedIds, likedCommentIds = [], onToggleCommentLike, selectedYear, currentView }) => {

  const [query, setQuery] = React.useState('');
  const [filterMode, setFilterMode] = React.useState<'all' | 'verified' | 'discussion'>('all');

  const normalize = (s: string) => s.toLowerCase();

  const matchesQuery = (q: Question) => {
    if (!query.trim()) return true;
    const ql = query.trim().toLowerCase();
    const text = (q.questionText || '') + ' ' + (q.aiAnswer || '');
    return text.toLowerCase().includes(ql);
  };

  const matchesFilterMode = (q: Question) => {
    if (filterMode === 'all') return true;
    if (filterMode === 'verified') {
      return q.type === 'ai' && q.status === 'answered';
    }
    if (filterMode === 'discussion') {
      return q.type === 'discussion';
    }
    return true;
  };

  const applyFilters = (items: Question[]) => {
    return items.filter(q => matchesQuery(q) && matchesFilterMode(q));
  };

  const renderForumList = (title: string, questions: Question[]) => {
    const emptyMessage = currentView === 'discussion'
        ? 'No discussions found for this category.'
        : 'No AI-answered questions found for this category.';
    return (
      <>
        <h3 className="text-xl font-bold text-gray-700 mb-4 pb-2 border-b-2 border-red-200">
          {title}
        </h3>
        {questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((q) => (
              <ForumItem 
                key={q.id} 
                question={q} 
                onToggleLike={onToggleLike}
                likedIds={likedIds}
                onAddComment={onAddComment}
                likedCommentIds={likedCommentIds}
                onToggleCommentLike={onToggleCommentLike}
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">
              {emptyMessage}
            </p>
          </div>
        )}
      </>
    );
  };

  const isFilterActive = selectedYear !== 'All';
  // apply search / type filters to lists
  const filteredPinned = applyFilters(pinnedQuestions);
  const filteredYearSpecific = applyFilters(yearSpecificQuestions);
  const filteredAll = applyFilters(allQuestions);

  const allNonPinnedQuestions = filteredAll.filter(q => !filteredPinned.some(pq => pq.id === q.id));

  const mainEmptyMessage = currentView === 'discussion'
    ? 'There are no discussions in the forum yet. Be the first to start one!'
    : 'There are no AI-answered questions in the forum yet. Be the first to ask one!';

  return (
    <div>
      {filteredPinned.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-700 mb-4 pb-2 border-b-2 border-yellow-400">
            📌 Pinned Questions
          </h3>
          <div className="space-y-4">
            {filteredPinned.map((q) => (
              <ForumItem
                key={`pinned-${q.id}`}
                question={q}
                onToggleLike={onToggleLike}
                likedIds={likedIds}
                likedCommentIds={likedCommentIds}
                onToggleCommentLike={onToggleCommentLike}
                onAddComment={onAddComment}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search + filter controls */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions or answers..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-red-700 focus:border-red-700"
          />
        </div>
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <span className="text-sm text-gray-600">Filter:</span>
          <div className="inline-flex rounded-md shadow-sm" role="tablist">
            <button type="button" onClick={() => setFilterMode('all')} className={`px-3 py-2 text-sm rounded-l-md ${filterMode==='all' ? 'bg-red-700 text-white' : 'bg-white text-gray-700 border'}`}>All</button>
            <button type="button" onClick={() => setFilterMode('verified')} className={`px-3 py-2 text-sm ${filterMode==='verified' ? 'bg-red-700 text-white' : 'bg-white text-gray-700 border'}`}>Verified Answers</button>
            <button type="button" onClick={() => setFilterMode('discussion')} className={`px-3 py-2 text-sm rounded-r-md ${filterMode==='discussion' ? 'bg-red-700 text-white' : 'bg-white text-gray-700 border'}`}>Discussions</button>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-4">Public Forum</h2>

      {allNonPinnedQuestions.length === 0 && filteredPinned.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">
            {mainEmptyMessage}
          </p>
        </div>
      ) : (
        <>
          {isFilterActive && (
            <div className="mb-8">
              {renderForumList(`Top Questions for ${selectedYear} Students`, filteredYearSpecific)}
            </div>
          )}
          
          {(() => {
            const yearSpecificIds = new Set(yearSpecificQuestions.map(q => q.id));
            const remainingQuestions = allNonPinnedQuestions.filter(q => !yearSpecificIds.has(q.id));
            
            if (remainingQuestions.length > 0) {
              return renderForumList(isFilterActive ? 'All Other Questions' : 'All Questions', remainingQuestions);
            }
            return null;
          })()}
        </>
      )}
    </div>
  );
};

export default ForumDisplay;