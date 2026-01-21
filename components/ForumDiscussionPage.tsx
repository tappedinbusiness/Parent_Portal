import React from 'react';
import type { Question, StudentYear } from '../types';
import ForumBase from './ForumBase';

interface ForumDiscussionPageProps {
  featuredQuestion: null;
  yearSpecificQuestions: Question[];
  allQuestions: Question[];
  onToggleLike: (questionId: string) => void;
  onAddComment: (questionId: string, commentText: string) => void;
  onToggleBookmark?: (questionId: string) => void;
  bookmarkedIds?: string[];
  likedIds: string[];
  likedCommentIds?: string[];
  onToggleCommentLike?: (commentId: string, questionId: string) => void;
  onLoadComments?: (questionId: string) => void;
  selectedYear: StudentYear | 'All';
}

const ForumDiscussionPage: React.FC<ForumDiscussionPageProps> = (props) => {
  return <ForumBase {...props} currentView="discussion" />;
};

export default ForumDiscussionPage;