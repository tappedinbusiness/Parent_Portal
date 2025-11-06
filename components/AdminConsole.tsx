import React from 'react';
import type { Question } from '../types';

interface AdminConsoleProps {
  questions: Question[];
  pinnedIds: string[];
  onPinToggle: (questionId: string) => void;
}

const AdminConsole: React.FC<AdminConsoleProps> = ({ questions, pinnedIds, onPinToggle }) => {
  const canPinMore = pinnedIds.length < 2;

  const sortedQuestions = [...questions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Admin Console - Pin Questions</h2>
      <p className="text-gray-600 mb-6">Select up to 2 questions to pin to the top of the forum.</p>
      
      {sortedQuestions.length === 0 ? (
        <p className="text-gray-500">No questions available to pin.</p>
      ) : (
        <ul className="space-y-4">
          {sortedQuestions.map((q) => {
            const isPinned = pinnedIds.includes(q.id);
            const isDisabled = !isPinned && !canPinMore;

            return (
              <li key={q.id} className={`p-4 border rounded-lg flex items-center justify-between transition-colors ${isDisabled ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}>
                <div className="flex-1 pr-4">
                  <p className="font-semibold">{q.questionText}</p>
                  <p className="text-sm text-gray-500">
                    Upvotes: {q.upvotes} &bull; Posted: {new Date(q.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  <label htmlFor={`pin-${q.id}`} className={`font-medium ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>Pin</label>
                  <input
                    type="checkbox"
                    id={`pin-${q.id}`}
                    checked={isPinned}
                    disabled={isDisabled}
                    onChange={() => onPinToggle(q.id)}
                    className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-200"
                    aria-label={`Pin question: ${q.questionText}`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AdminConsole;
