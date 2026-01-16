import React, { useState, useEffect, useMemo } from 'react';
import { getAIAnswer, moderateDiscussionTopic } from './services/openaiService';
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
import { SignedIn, useAuth } from '@clerk/clerk-react';

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
  if (page === "forum") {
    loadQuestionsFromDb(forumViewFilter); // forumViewFilter is 'ai' | 'discussion'
  }
  }, [page, forumViewFilter]);

  const loadQuestionsFromDb = async (type: "ai" | "discussion") => {
    try {
      const res = await fetch(`/api/questions?type=${encodeURIComponent(type)}&limit=50`);
      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to load questions:", data);
        return;
      }

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

      const token = isSignedIn ? await getToken() : null;

      const res = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: "discussion",
          topic,
          studentYear,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to submit discussion:", data);
        alert("Failed to submit discussion.");
        return false;
      }

      const created = data.question as Question;

      // Insert into local state so it shows instantly
      setQuestions((prev) => [created, ...prev]);

      setPage("forum");
      setForumViewFilter("discussion");
      window.scrollTo({ top: 0, behavior: "smooth" });

      return true;
    } catch (err) {
      console.error("Failed to submit discussion:", err);
      alert(`An error occurred while submitting your discussion. Please check the console for details.`);
      return false;
    }
  };

  const handleAddComment = async (questionId: string, commentText: string) => {
    try{
      if(!SignedIn){
        alert("You must be signed in to add a comment.");
        return;
      }

      const token = await getToken();
      if(!token){
        alert("Please sign in again.")
        return;
      }

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questionId, text: commentText }),
      });

      const data = await res.json();

      if(!res.ok){
        console.error("Failed to add comment:", data);
        alert("Failed to add comment. Please try again.");
        return;
      }

      const newComment: Comment = data.comment;
      
      setQuestions(prevQuestions =>
        prevQuestions.map(q =>
          q.id === questionId
            ? { ...q, comments: [...q.comments, newComment] }
            : q
        )
      );

    } catch(err){      console.error("Failed to add comment:", err);
      alert("An error occurred while adding your comment.");
      return;
    }
  };

  const loadCommentsForQuestion = async (questionId: string) => {
    try {
      const res = await fetch(`/api/comments?questionId=${encodeURIComponent(questionId)}`);
      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to load comments:", data);
        return;
      }

      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, comments: data.comments } : q))
      );

      setFeaturedQuestion((prev) =>
        prev && prev.id === questionId ? { ...prev, comments: data.comments } : prev
      );
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  const handleToggleLike = async (questionId: string) => {
    try {
      if (!isSignedIn) {
        alert("Please sign in to like posts.");
        return;
      }
      const token = await getToken();
      if (!token) return;

      const res = await fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetType: "question", targetId: questionId }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Like failed:", data);
        return;
      }

      // Update local likedIds + upvote count
      setLikedQuestionIds((prev) =>
        data.liked ? [...prev, questionId] : prev.filter((id) => id !== questionId)
      );

      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, upvotes: data.upvotes } : q))
      );

      setFeaturedQuestion((prev) =>
        prev && prev.id === questionId ? { ...prev, upvotes: data.upvotes } : prev
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleCommentLike = async (commentId: string, questionId: string) => {
    try {
      if (!isSignedIn) {
        alert("Please sign in to like comments.");
        return;
      }
      const token = await getToken();
      if (!token) return;

      const res = await fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetType: "comment", targetId: commentId }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Comment like failed:", data);
        return;
      }

      setLikedCommentIds((prev) =>
        data.liked ? [...prev, commentId] : prev.filter((id) => id !== commentId)
      );

      // update comment upvotes inside the question’s comments
      const updateQuestionComments = (q: any) => ({
        ...q,
        comments: (q.comments ?? []).map((c: any) =>
          c.id === commentId ? { ...c, upvotes: data.upvotes } : c
        ),
      });

      setQuestions((prev) => prev.map((q) => (q.id === questionId ? updateQuestionComments(q) : q)));
      setFeaturedQuestion((prev) =>
        prev && prev.id === questionId ? updateQuestionComments(prev) : prev
      );
    } catch (e) {
      console.error(e);
    }
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
                onLoadComments={loadCommentsForQuestion}
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