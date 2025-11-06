import React from 'react';
import type { Question, StudentYear } from '../types';
import ForumItem from './ForumItem';

interface ForumDisplayProps {
  pinnedQuestions: Question[];
  yearSpecificQuestions: Question[];
  allQuestions: Question[];
  onUpvote: (questionId: string) => void;
  onAddComment: (questionId: string, commentText: string) => void;
  selectedYear: StudentYear | 'All';
  currentView: 'discussion' | 'ai';
}

const ForumDisplay: React.FC<ForumDisplayProps> = ({ pinnedQuestions, yearSpecificQuestions, allQuestions, onUpvote, onAddComment, selectedYear, currentView }) => {

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
                onUpvote={onUpvote}
                onAddComment={onAddComment}
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
  const allNonPinnedQuestions = allQuestions.filter(q => !pinnedQuestions.some(pq => pq.id === q.id));

  const mainEmptyMessage = currentView === 'discussion'
    ? 'There are no discussions in the forum yet. Be the first to start one!'
    : 'There are no AI-answered questions in the forum yet. Be the first to ask one!';

  return (
    <div>
      {pinnedQuestions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-700 mb-4 pb-2 border-b-2 border-yellow-400">
            📌 Pinned Questions
          </h3>
          <div className="space-y-4">
            {pinnedQuestions.map((q) => (
              <ForumItem
                key={`pinned-${q.id}`}
                question={q}
                onUpvote={onUpvote}
                onAddComment={onAddComment}
              />
            ))}
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-800 mb-4">Public Forum</h2>

      {allNonPinnedQuestions.length === 0 && pinnedQuestions.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">
            {mainEmptyMessage}
          </p>
        </div>
      ) : (
        <>
          {isFilterActive && (
            <div className="mb-8">
              {renderForumList(`Top Questions for ${selectedYear} Students`, yearSpecificQuestions)}
            </div>
          )}
          
          {(() => {
            const yearSpecificIds = new Set(yearSpecificQuestions.map(q => q.id));
            const remainingQuestions = allQuestions.filter(q => !yearSpecificIds.has(q.id));
            
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