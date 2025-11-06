import React, { useState } from 'react';
import { Question, QuestionStatus, Comment, StudentYear, QuestionType } from '../types';
import { marked } from 'marked';

// Configure marked library for secure and consistent rendering
marked.setOptions({
  gfm: true, // Enable GitHub Flavored Markdown
  breaks: true, // Interpret carriage returns as <br> tags
  mangle: false, // Disable obfuscating email addresses
  headerIds: false, // Disable automatic header ID generation
});

const StatusBadge: React.FC<{ status?: QuestionStatus }> = ({ status }) => {
  if (!status) return null;
  const baseClasses = "text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full";
  const statusConfig = {
    answered: {
      text: "Answered",
      classes: "bg-green-100 text-green-800",
    },
    rejected: {
      text: "Out of Scope",
      classes: "bg-yellow-100 text-yellow-800",
    },
    escalated: {
      text: "Escalated",
      classes: "bg-blue-100 text-blue-800",
    },
  };

  const config = statusConfig[status] || { text: 'Unknown', classes: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`${baseClasses} ${config.classes}`}>{config.text}</span>
  );
};

const TypeBadge: React.FC<{ type: QuestionType }> = ({ type }) => {
  const baseClasses = "text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full";
  const typeConfig = {
      ai: { text: "AI Question", classes: "bg-red-100 text-red-800" },
      discussion: { text: "Discussion", classes: "bg-indigo-100 text-indigo-800" },
  };
  const config = typeConfig[type];
  return <span className={`${baseClasses} ${config.classes}`}>{config.text}</span>
}

const StudentYearBadge: React.FC<{ year?: StudentYear }> = ({ year }) => {
    const text = year || 'General';
    return (
        <span className="text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
            {text}
        </span>
    );
};

const CommentForm: React.FC<{ onAddComment: (text: string) => void }> = ({ onAddComment }) => {
    const [commentText, setCommentText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        onAddComment(commentText);
        setCommentText('');
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-start space-x-3">
            <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-red-700 focus:border-red-700 text-sm"
                rows={2}
            />
            <button
                type="submit"
                className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:bg-gray-300"
                disabled={!commentText.trim()}
            >
                Post
            </button>
        </form>
    );
};

const ForumItem: React.FC<{ question: Question; onUpvote: (id: string) => void; onAddComment: (id: string, text: string) => void; }> = ({ question, onUpvote, onAddComment }) => {
  const formattedDate = question.timestamp
    ? new Date(question.timestamp).toLocaleString()
    : 'Just now';

  // Parse the AI answer from markdown to HTML
  const htmlAnswer = question.aiAnswer ? marked(question.aiAnswer) : '';
  const isDiscussion = question.type === 'discussion';

  return (
    <article className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-3 text-gray-500">
        <div className="flex items-center flex-wrap">
            <TypeBadge type={question.type} />
            <StatusBadge status={question.status} />
            <StudentYearBadge year={question.studentYear} />
        </div>
        <span className="text-sm flex-shrink-0 ml-2">{formattedDate}</span>
      </div>
      
      <div className="mb-4">
        <p className="font-semibold text-gray-600">{isDiscussion ? 'Topic:' : 'Q:'}</p>
        <p className="ml-4 text-lg text-gray-900">{question.questionText}</p>
      </div>

      {!isDiscussion && question.aiAnswer && (
        <div className="p-4 bg-red-50 border-l-4 border-red-700 rounded-r-lg">
          <p className="font-semibold text-red-900">A: (UA AI Assistant)</p>
          <div 
            className="prose prose-sm max-w-none text-gray-800 ml-4 prose-a:text-blue-600 hover:prose-a:text-blue-800 hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: htmlAnswer }}
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <button 
            onClick={() => onUpvote(question.id)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-red-800 font-medium transition-colors p-2 rounded-md hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          <span>Upvote ({question.upvotes})</span>
        </button>
      </div>
      
      <div className="mt-4 border-t pt-4">
        <h4 className="text-md font-semibold text-gray-700 mb-3">Comments ({question.comments.length})</h4>
        <div className="space-y-4">
            {question.comments.map(comment => (
                <div key={comment.id} className="text-sm p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-800">{comment.text}</p>
                    <p className="text-xs text-gray-400 mt-1 text-right">{new Date(comment.timestamp).toLocaleString()}</p>
                </div>
            ))}
            {question.comments.length === 0 && (
                <p className="text-sm text-gray-500">No comments yet.</p>
            )}
        </div>
        <div className="mt-4">
            <CommentForm onAddComment={(text) => onAddComment(question.id, text)} />
        </div>
      </div>
    </article>
  );
};

export default ForumItem;