import React, { useState, useEffect, useMemo } from 'react';
import { getAIAnswer, checkForDuplicate, correctSpelling, moderateDiscussionTopic } from './services/geminiService';
import type { Question, StudentYear, Comment } from './types';
import Header from './components/Header';
import QuestionForm from './components/QuestionForm';
import DiscussionForm from './components/DiscussionForm';
import ForumDisplay from './components/ForumDisplay';
import StudentYearSelect from './components/StudentYearSelect';
import AdminConsole from './components/AdminConsole';
import ForumFilter from './components/ForumFilter';
import { v4 as uuidv4 } from 'uuid';

type Page = 'home' | 'forum' | 'admin';
type ForumView = 'discussion' | 'ai';

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [page, setPage] = useState<Page>('home');
  const [studentYear, setStudentYear] = useState<StudentYear | 'All'>('All');
  const [pinnedQuestionIds, setPinnedQuestionIds] = useState<string[]>([]);
  const [forumViewFilter, setForumViewFilter] = useState<ForumView>('discussion');


  const handleAiQuestionSubmit = async (questionText: string): Promise<boolean> => {
    try {
        const correctedQuestionText = await correctSpelling(questionText);
        const existingQuestionTexts = questions.map(q => q.questionText);
        const duplicateCheck = await checkForDuplicate(correctedQuestionText, existingQuestionTexts);

        if (duplicateCheck.isDuplicate) {
            alert(`This question seems to be a duplicate of a previously asked question. Please check the forum.`);
            setPage('forum');
            setForumViewFilter('ai');
            return false;
        }

        const aiResponse = await getAIAnswer(correctedQuestionText, studentYear);

        if (aiResponse.status === 'rejected') {
          alert(`Your question could not be answered. Reason: ${aiResponse.reason}`);
          return false;
        }
        
        const newQuestion: Question = {
            id: uuidv4(),
            userId: 'anonymous',
            type: 'ai',
            questionText: correctedQuestionText,
            aiAnswer: aiResponse.answer || 'No response generated.',
            status: aiResponse.status,
            timestamp: new Date(),
            upvotes: 0,
            comments: [],
        };

        if (studentYear !== 'All') {
            newQuestion.studentYear = studentYear;
        }
        
        setQuestions(prevQuestions => [newQuestion, ...prevQuestions]);
        setPage('forum');
        setForumViewFilter('ai');
        return true;

    } catch(err) {
        console.error("Failed to submit question:", err);
        alert(`An error occurred while submitting your question. Please check the console for details.`);
        return false;
    }
  };

  const handleDiscussionSubmit = async (topic: string): Promise<boolean> => {
    try {
      const moderationResult = await moderateDiscussionTopic(topic);

      if (!moderationResult.isApproved) {
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


  const handleUpvote = (questionId: string) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === questionId ? { ...q, upvotes: q.upvotes + 1 } : q
      )
    );
  };

  const handleAddComment = (questionId: string, commentText: string) => {
    const newComment: Comment = {
      id: uuidv4(),
      text: commentText,
      timestamp: new Date()
    };

    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === questionId
          ? { ...q, comments: [...q.comments, newComment] }
          : q
      )
    );
  };

  const handlePinToggle = (questionId: string) => {
    setPinnedQuestionIds(prevIds => {
      if (prevIds.includes(questionId)) {
        return prevIds.filter(id => id !== questionId);
      }
      if (prevIds.length < 2) {
        return [...prevIds, questionId];
      }
      return prevIds;
    });
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
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
        {page !== 'admin' && (
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
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Get Answers</h2>
                    <p className="text-gray-600 mb-4">
                        Submit your question about student life, academics, or administration at the University of Alabama. Our AI assistant will provide an answer based on official UA resources.
                    </p>
                    <QuestionForm 
                        onSubmit={handleAiQuestionSubmit}
                        currentStudentYear={studentYear}
                    />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Start a Discussion</h2>
                    <p className="text-gray-600 mb-4">
                        Crowd-source real reviews, thoughts, and experiences from other parents on the platform.
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
                pinnedQuestions={pinnedQuestions}
                yearSpecificQuestions={yearSpecificQuestions}
                allQuestions={allQuestions}
                onUpvote={handleUpvote}
                onAddComment={handleAddComment}
                selectedYear={studentYear}
                currentView={forumViewFilter}
            />
          </>
        )}
        {page === 'admin' && (
          <AdminConsole
            questions={questions}
            pinnedIds={pinnedQuestionIds}
            onPinToggle={handlePinToggle}
          />
        )}
      </main>
    </div>
  );
};

export default App;