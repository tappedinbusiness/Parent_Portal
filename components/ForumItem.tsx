import React, { useState } from 'react';
import { Question, QuestionStatus, Comment, StudentYear, QuestionType } from '../types';
import { marked } from 'marked';
import alabamaLogo from '../assets/Alabama_Crimson_Tide_logo.svg.png';
import groupIcon from '../assets/group-of-people-svgrepo-com.svg';
import fbLikeIcon from '../assets/facebook-like-svgrepo-com.svg';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';

// Configure marked library for secure and consistent rendering
marked.setOptions({
  gfm: true, // Enable GitHub Flavored Markdown
  breaks: true, // Interpret carriage returns as <br> tags
  //mangle: false, // Disable obfuscating email addresses
  //headerIds: false, // Disable automatic header ID generation
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

const CommentForm: React.FC<{
  onAddComment: (text: string) => void;
  onOpen?: () => void;
  }> = ({ onAddComment, onOpen }) => {
  const [commentText, setCommentText] = useState('');

  React.useEffect(() => {
    onOpen?.();
    // only run once when the form mounts (when comments UI opens)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(commentText);
    setCommentText('');
  };

  return (
    <>
      <SignedOut>
        <div className="p-3 bg-white rounded-md border border-gray-200 text-sm">
          <p className="text-gray-700 mb-2">You must be signed in to post comments.</p>
          <SignInButton mode="redirect">
            <button className="px-3 py-2 bg-red-800 text-white rounded-md">Sign In</button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
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
      </SignedIn>
    </>
  );
};

const ForumItem: React.FC<{ question: Question; 
  onToggleLike: (id: string) => void; likedIds?: string[]; 
  onAddComment: (id: string, text: string) => void; likedCommentIds?: string[]; 
  onLoadComments?: (questionId: string) => void; 
  onToggleCommentLike?: (commentId: string, questionId: string) => void; 
  onToggleBookmark?: (questionId: string) => void;  bookmarkedIds?: string[];
  }> = 
  ({ question, onToggleLike, likedIds = [], onAddComment, likedCommentIds = [], onToggleCommentLike, onLoadComments, onToggleBookmark, bookmarkedIds}) => {

  const formattedDate = question.timestamp
    ? new Date(question.timestamp).toLocaleString()
    : 'Just now';

  // Parse the AI answer from markdown to HTML
  const htmlAnswer = question.aiAnswer ? marked(question.aiAnswer) : '';
  const isDiscussion = question.type === 'discussion';

  const commentsSafe = question.comments ?? [];

  // Sort comments by upvotes (desc), then by recency (timestamp desc) for display
  const sortedComments = [...(commentsSafe?? [])].sort((a, b) => {
    const upA = a.upvotes ?? 0;
    const upB = b.upvotes ?? 0;
    if (upB !== upA) return upB - upA;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <article className="relative bg-white p-6 rounded-lg shadow-md border border-gray-200">
      {/* Discussion badge in top-right for discussion posts */}
      {isDiscussion && (
        <div className="absolute top-12 right-3">
          <div className="group relative inline-block">
            <img src={groupIcon} alt="Start a discussion" className="w-10 h-10 object-contain rounded" />

            <div
              role="tooltip"
              className="pointer-events-none absolute right-full top-0 transform translate-x-0 -translate-y-1/4 md:-translate-x-3 md:translate-y-0 w-64 md:w-72 bg-white border border-red-200 text-sm md:text-base text-gray-800 rounded-md p-3 shadow-lg opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 z-10"
            >
              <div className="font-semibold text-red-800 mb-1">Discussions</div>
              <div>Share opinions, experiences, and stories with other parents and students.</div>
              {/* Tooltip arrow */}
              <div className="absolute -right-3 top-4 w-3 h-3 bg-white border-t border-l border-red-200 transform rotate-45"></div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="font-semibold text-gray-600">{isDiscussion ? 'Topic:' : 'Q:'}</p>
        <p className="ml-4 p-2 text-lg text-gray-900">{question.questionText}</p>
      </div>

      {!isDiscussion && question.aiAnswer && (
        <div className="relative p-4 pr-16 bg-red-50 border-l-4 border-red-700 rounded-r-lg">
          {/* University endorsement badge in the corner with styled hover tooltip */}
          <div className="absolute top-3 right-3">
            <div className="group relative inline-block">
              <img
                src={alabamaLogo}
                alt="University-backed answer"
                className="w-12 h-12 object-contain rounded"
              />

              <div
                role="tooltip"
                className="pointer-events-none absolute right-full top-0 transform translate-x-0 -translate-y-1/4 md:-translate-x-3 md:translate-y-0 w-64 md:w-72 bg-white border border-red-200 text-sm md:text-base text-gray-800 rounded-md p-3 shadow-lg opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 z-10"
              >
                <div className="font-semibold text-red-800 mb-1">University-backed answer</div>
                <div>Real answers backed by university rules, official sources, and documented policies.</div>
                {/* Tooltip arrow */}
                <div className="absolute -right-3 top-4 w-3 h-3 bg-white border-t border-l border-red-200 transform rotate-45"></div>
              </div>
            </div>
          </div>

          <p className="font-semibold text-red-900">A: (UA AI Assistant)</p>
          <div 
            className="prose prose-sm max-w-none text-gray-800 ml-4 prose-a:text-blue-600 hover:prose-a:text-blue-800 hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: htmlAnswer }}
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <div className="flex items-center">
          {/** Like button: signed-in users can like; signed-out see sign-in CTA */}
          <SignedOut>
            <SignInButton mode="redirect">
              <button className="flex items-center space-x-2 text-sm font-medium transition-colors p-2 rounded-md focus:outline-none text-gray-600 hover:text-red-800 hover:bg-gray-100">
                <img src={fbLikeIcon} alt="Like" className="w-5 h-5 object-contain" />
                <span>Like ({question.upvotes})</span>
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <button
              onClick={() => onToggleLike(question.id)}
              aria-pressed={likedIds.includes(question.id)}
              className={`flex items-center space-x-2 text-sm font-medium transition-colors p-2 rounded-md focus:outline-none ${likedIds.includes(question.id) ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:text-red-800 hover:bg-gray-100'}`}
            >
              <img src={fbLikeIcon} alt="Like" className="w-5 h-5 object-contain" />
              <span>{likedIds.includes(question.id) ? 'Liked' : 'Like'} ({question.upvotes})</span>
            </button>
          </SignedIn>

          {/* Bookmark button */}
          <SignedOut>
            <SignInButton mode="redirect">
              <button className="flex items-center space-x-2 text-sm font-medium transition-colors p-2 rounded-md focus:outline-none text-gray-600 hover:text-red-800 hover:bg-gray-100">
                <span className="text-lg leading-none">☆</span>
                <span>Bookmark</span>
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <button
              onClick={() => onToggleBookmark?.(question.id)}
              aria-pressed={(bookmarkedIds ?? []).includes(question.id)}
              className={`ml-2 flex items-center space-x-2 text-sm font-medium transition-colors p-2 rounded-md focus:outline-none ${
                (bookmarkedIds ?? []).includes(question.id)
                  ? 'text-yellow-700 bg-yellow-50'
                  : 'text-gray-600 hover:text-red-800 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg leading-none">{(bookmarkedIds ?? []).includes(question.id) ? '★' : '☆'}</span>
              <span>{(bookmarkedIds ?? []).includes(question.id) ? 'Bookmarked' : 'Bookmark'}</span>
            </button>
          </SignedIn>
        </div>

        <span className="text-sm text-gray-500 ml-4">Last Verified: {formattedDate}</span>
      </div>
      
      <div className="mt-4 border-t pt-4">
        <h4 className="text-md font-semibold text-gray-700 mb-3">Comments ({commentsSafe.length})</h4>
        <div className="space-y-4">
          {sortedComments.map(comment => (
            <div key={comment.id} className="text-sm p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                {(comment as any).authorAvatarUrl ? (
                  <img
                    src={(comment as any).authorAvatarUrl}
                    alt={(comment as any).authorName || 'User'}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200" />
                )}
                <div className="text-sm font-medium text-gray-800">
                  {(comment as any).authorName || 'Anonymous'}
                </div>
              </div>

              <p className="text-gray-800">{comment.text}</p>

              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">{new Date(comment.timestamp).toLocaleString()}</p>

                <SignedOut>
                  <SignInButton mode="redirect">
                    <button className="ml-3 flex items-center space-x-2 text-xs font-medium transition-colors p-1 rounded text-gray-500 hover:text-green-700 hover:bg-gray-100">
                      <img src={fbLikeIcon} alt="Like comment" className="w-4 h-4 object-contain" />
                      <span>{comment.upvotes ?? 0}</span>
                    </button>
                  </SignInButton>
                </SignedOut>

                <SignedIn>
                  <button
                    onClick={() => onToggleCommentLike?.(comment.id, question.id)}
                    aria-pressed={likedCommentIds.includes(comment.id)}
                    className={`ml-3 flex items-center space-x-2 text-xs font-medium transition-colors p-1 rounded ${
                      likedCommentIds.includes(comment.id)
                        ? 'text-green-700 bg-green-50'
                        : 'text-gray-500 hover:text-green-700 hover:bg-gray-100'
                    }`}
                  >
                    <img src={fbLikeIcon} alt="Like comment" className="w-4 h-4 object-contain" />
                    <span>{comment.upvotes ?? 0}</span>
                  </button>
                </SignedIn>
              </div>
            </div>
          ))}
            {commentsSafe.length === 0 && (
                <p className="text-sm text-gray-500">No comments yet.</p>
            )}
        </div>
        <div className="mt-4">
            <CommentForm onAddComment={(text) => onAddComment(question.id, text)} 
              onOpen={() => onLoadComments?.(question.id)}/>
        </div>
      </div>
    </article>
  );
};

export default ForumItem;