import React, { useState, useEffect, useMemo } from 'react';
import { getAIAnswer, checkForDuplicate, correctSpelling, moderateDiscussionTopic } from './services/openaiService';
import type { Question, StudentYear, Comment } from './types';
import Header from './components/Header';
import QuestionForm from './components/QuestionForm';
import DiscussionForm from './components/DiscussionForm';
import ForumDisplay from './components/ForumDisplay';
import StudentYearSelect from './components/StudentYearSelect';
import Account from './components/Account';
import ForumFilter from './components/ForumFilter';
import { v4 as uuidv4 } from 'uuid';
import alabamaLogo from './assets/Alabama_Crimson_Tide_logo.svg.png';
import groupIcon from './assets/group-of-people-svgrepo-com.svg';
import { useAuth } from '@clerk/clerk-react';

type Page = 'home' | 'forum' | 'account';
type ForumView = 'discussion' | 'ai';

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);

  const [page, setPage] = useState<Page>('home');
  const [studentYear, setStudentYear] = useState<StudentYear | 'All'>('All');
  const [pinnedQuestionIds, setPinnedQuestionIds] = useState<string[]>([]);
  const [forumViewFilter, setForumViewFilter] = useState<ForumView>('discussion');
  const [likedQuestionIds, setLikedQuestionIds] = useState<string[]>([]);
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([]);
  const [featuredQuestion, setFeaturedQuestion] = useState<Question | null>(null);

  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    loadAiQuestionsFromDb();
  }, []);

  const loadAiQuestionsFromDb = async () => {
    try {
      const res = await fetch("/api/questions?type=ai&limit=50");
      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to load questions:", data);
        return;
      }

      // data.questions will match your Question shape (timestamp is a Date already)
      setQuestions(data.questions);
    } catch (err) {
      console.error("Failed to load questions:", err);
    }
  };


  const handleAiQuestionSubmit = async (questionText: string): Promise<boolean> => {
    try {

      // Get a token if signed in. Anonymous users can still submit questions.
      const token = isSignedIn ? await getToken() : null;

      // New getAIAnswer expects an object (per the updated openaiService.ts)
      const aiResponse = await getAIAnswer({
        question: questionText,
        studentYear,
        token,
      });

      // Handle transport/server errors
      if ("error" in aiResponse) {
        console.error("AI request failed:", aiResponse);
        alert(`An error occurred while submitting your question.`);
        return false;
      }

      // Handle rejected questions
      if (aiResponse.status === "rejected") {
        alert(`Your question could not be answered. Reason: ${aiResponse.reason}`);
        return false;
      }

      // Build a question object from the response.
      // If the server returned a questionId, use it so duplicates map to the same item.
      const serverId = aiResponse.questionId ?? null;
      const localId = serverId ?? uuidv4();

      // Avoid duplicating in local state if we already have it (common on duplicates).
      const alreadyInState = serverId
        ? questions.some((q) => q.id === serverId)
        : false;

      if (!alreadyInState) {
        const newQuestion: Question = {
          id: localId,
          userId: isSignedIn ? "signed-in" : "anonymous", // keep your existing pattern for now
          type: "ai",
          questionText: questionText,
          aiAnswer: aiResponse.answer || "No response generated.",
          status: aiResponse.status,
          timestamp: new Date(),
          upvotes: 0,
          comments: [],
        };

        if (studentYear !== "All") {
          newQuestion.studentYear = studentYear;
        }

        setQuestions((prevQuestions) => [newQuestion, ...prevQuestions]);
      } else {
        // If it was already in state (duplicate), you may still want to ensure the answer is present.
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === serverId
              ? { ...q, aiAnswer: aiResponse.answer || q.aiAnswer }
              : q
          )
        );
      }

      setFeaturedQuestion((prev) => ({
        ...(prev ?? {}),
        id: localId,
        questionText: questionText,
        aiAnswer: aiResponse.answer || prev?.aiAnswer,
        status: aiResponse.status,
        timestamp: new Date(),
      }));


      // Navigate to forum either way (new or duplicate)
      setPage("forum");
      setForumViewFilter("ai");
      window.scrollTo({ top: 0, behavior: "smooth" });

      return true;
    } catch (err) {
      console.error("Failed to submit question:", err);
      alert(`An error occurred while submitting your question. Please check the console for details.`);
      return false;
    }
  };


  const handleDiscussionSubmit = async (topic: string): Promise<boolean> => {
    try {
      const moderationResult = await moderateDiscussionTopic();

      if (!moderationResult.isAppropriate) {
        alert(`Your discussion topic could not be posted. Reason: ${moderationResult.reason}`);
        return false;
      }

      const newDiscussion: Question = {
        id: uuidv4(),
        userId: 'anonymous',
        type: 'discussion',
        questionText: topic,
        timestamp: new Date(),
        upvotes: 0,
        comments: [],
      };
      
      if (studentYear !== 'All') {
          newDiscussion.studentYear = studentYear;
      }

      setQuestions(prevQuestions => [newDiscussion, ...prevQuestions]);
      setPage('forum');
      setForumViewFilter('discussion');
      return true;
    } catch (err) {
      console.error("Failed to submit discussion:", err);
      alert(`An error occurred while submitting your discussion. Please check the console for details.`);
      return false;
    }
  };


  // Toggle like for a question: add/remove from liked list and update upvote count
  const handleToggleLike = (questionId: string) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q => {
        if (q.id !== questionId) return q;
        const isLiked = likedQuestionIds.includes(questionId);
        const newUpvotes = isLiked ? Math.max(0, q.upvotes - 1) : q.upvotes + 1;
        return { ...q, upvotes: newUpvotes };
      })
    );

    setLikedQuestionIds(prev =>
      prev.includes(questionId) ? prev.filter(id => id !== questionId) : [...prev, questionId]
    );
  };

  const handleAddComment = (questionId: string, commentText: string) => {
    const newComment: Comment = {
      id: uuidv4(),
      text: commentText,
      timestamp: new Date(),
      upvotes: 0
    };

    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === questionId
          ? { ...q, comments: [...q.comments, newComment] }
          : q
      )
    );
  };

  // Toggle like for a comment
  const handleToggleCommentLike = (commentId: string, questionId: string) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q => {
        if (q.id !== questionId) return q;
        return {
          ...q,
          comments: q.comments.map(c => {
            if (c.id !== commentId) return c;
            const isLiked = likedCommentIds.includes(commentId);
            const newUpvotes = isLiked ? Math.max(0, (c.upvotes || 0) - 1) : (c.upvotes || 0) + 1;
            return { ...c, upvotes: newUpvotes };
          })
        };
      })
    );

    setLikedCommentIds(prev => prev.includes(commentId) ? prev.filter(id => id !== commentId) : [...prev, commentId]);
  };
  
  const pinnedQuestions = useMemo(() => {
    return pinnedQuestionIds
      .map(id => questions.find(q => q.id === id))
      .filter((q): q is Question => !!q)
      .filter(q => q.type === forumViewFilter);
  }, [questions, pinnedQuestionIds, forumViewFilter]);

  const { yearSpecificQuestions, allQuestions } = useMemo(() => {
    const sorted = [...questions]
        .filter(q => !pinnedQuestionIds.includes(q.id))
        .filter(q => q.type === forumViewFilter)
        .sort((a, b) => {
          // sort by upvotes desc, then by timestamp desc
          if ((b.upvotes || 0) !== (a.upvotes || 0)) return (b.upvotes || 0) - (a.upvotes || 0);
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

    if (studentYear === 'All') {
        return { yearSpecificQuestions: [], allQuestions: sorted };
    }
    
    const yearQuestions = sorted.filter(q => q.studentYear === studentYear);
    const top15 = yearQuestions.slice(0, 15);
    
    return { yearSpecificQuestions: top15, allQuestions: sorted };
  }, [questions, studentYear, pinnedQuestionIds, forumViewFilter]);


  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header currentPage={page} setPage={setPage} />
      <main className="container mx-auto p-4 md:p-8 max-w-4xl">
        {page !== 'account' && (
          <div className="mb-6">
              <label htmlFor="global-student-year" className="block text-sm font-medium text-gray-700 mb-1">
                  My Student's Year:
              </label>
              <div className="max-w-xs">
                  <StudentYearSelect
                      id="global-student-year"
                      value={studentYear}
                      onChange={setStudentYear}
                      includeAll={true}
                  />
              </div>
          </div>
        )}

        {page === 'home' && (
             <div className="space-y-8">
                <div className="relative bg-white p-6 pr-20 rounded-lg shadow-md">
                    <div className="absolute top-3 right-3">
                      <div className="group relative inline-block">
                        <img
                          src={alabamaLogo}
                          alt="University-backed answers"
                          className="w-12 h-12 object-contain rounded"
                        />

                        <div
                          role="tooltip"
                          className="pointer-events-none absolute right-full top-0 transform translate-x-0 -translate-y-1/4 md:-translate-x-3 md:translate-y-0 w-64 md:w-72 bg-white border border-red-200 text-sm md:text-base text-gray-800 rounded-md p-3 shadow-lg opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 z-10"
                        >
                          <div className="font-semibold text-red-800 mb-1">University-backed answer</div>
                          <div>Real answers backed by university rules, official sources, and documented policies.</div>
                          <div className="absolute -right-3 top-4 w-3 h-3 bg-white border-t border-l border-red-200 transform rotate-45"></div>
                        </div>
                      </div>
                    </div>
                     <h2 className="text-2xl font-bold text-gray-800 mb-2">Get Verified Answers</h2>
                     <p className="text-gray-600 mb-4">
                         Submit your question about student life, academics, or administration at the University of Alabama. Our AI assistant will provide an answer based on official UA resources. Verified Answers are school-sanctioned, sourced, and fact-checked.
                     </p>
                     <QuestionForm 
                         onSubmit={handleAiQuestionSubmit}
                         currentStudentYear={studentYear}
                     />
                 </div>
                <div className="relative bg-white p-6 pr-20 rounded-lg shadow-md">
                    <div className="absolute top-3 right-3">
                      <div className="group relative inline-block">
                        <img
                          src={groupIcon}
                          alt="Start a discussion"
                          className="w-12 h-12 object-contain rounded"
                        />

                        <div
                          role="tooltip"
                          className="pointer-events-none absolute right-full top-0 transform translate-x-0 -translate-y-1/4 md:-translate-x-3 md:translate-y-0 w-64 md:w-72 bg-white border border-red-200 text-sm md:text-base text-gray-800 rounded-md p-3 shadow-lg opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 z-10"
                        >
                          <div className="font-semibold text-red-800 mb-1">Discussions</div>
                          <div>Share opinions, experiences, and stories with other parents and students.</div>
                          <div className="absolute -right-3 top-4 w-3 h-3 bg-white border-t border-l border-red-200 transform rotate-45"></div>
                        </div>
                      </div> 
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Start a Discussion</h2>
                    <p className="text-gray-600 mb-4">
                        Crowd-source real reviews, thoughts, and experiences from other parents on the platform. Discussions are community opinions and personal stories.

                    </p>
                    <DiscussionForm onSubmit={handleDiscussionSubmit} />
                </div>
             </div>
        )}
        {page === 'forum' && (
          <>
            <ForumFilter 
              currentView={forumViewFilter}
              onViewChange={setForumViewFilter}
            />
            <ForumDisplay 
                featuredQuestion={featuredQuestion}
                yearSpecificQuestions={yearSpecificQuestions}
                allQuestions={allQuestions}
                onToggleLike={handleToggleLike}
                likedIds={likedQuestionIds}
                likedCommentIds={likedCommentIds}
                onToggleCommentLike={handleToggleCommentLike}
                onAddComment={handleAddComment}
                selectedYear={studentYear}
                currentView={forumViewFilter}
            />
          </>
        )}
        {page === 'account' && (
          <Account />
        )}
      </main>
    </div>
  );
};

export default App;