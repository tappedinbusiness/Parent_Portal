export type QuestionStatus = 'answered' | 'rejected' | 'escalated';

export type StudentYear = 'Incoming/Prospective' | 'Freshman' | 'Sophomore' | 'Junior' | 'Senior';

export type QuestionType = 'ai' | 'discussion';

export interface Comment {
    id: string;
    text: string;
    timestamp: Date;
}

export interface Question {
  id: string;
  userId: string;
  type: QuestionType;
  questionText: string;
  aiAnswer?: string;
  status?: QuestionStatus;
  timestamp: Date;
  upvotes: number;
  comments: Comment[];
  studentYear?: StudentYear;
}