import React, { useState } from 'react';
import Spinner from './Spinner';
import type { StudentYear } from '../types';

interface QuestionFormProps {
  onSubmit: (questionText: string) => Promise<boolean>;
  currentStudentYear: StudentYear | 'All';
}

const QuestionForm: React.FC<QuestionFormProps> = ({ onSubmit, currentStudentYear }) => {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Question cannot be empty.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      const success = await onSubmit(question);
      if (success) {
        setQuestion('');
      }
    } catch (err) {
      console.error("Submission failed:", err);
      setError('Failed to submit your question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-red-700 transition duration-200 resize-none"
        placeholder="e.g., When is the deadline for spring tuition payment?"
        value={question}
        onChange={(e) => {
            setQuestion(e.target.value)
            if(error) setError(null);
        }}
        disabled={isSubmitting}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting || !question.trim()}
        className="mt-4 w-full flex justify-center items-center bg-red-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Spinner />
            <span>Submitting...</span>
          </>
        ) : (
          'Submit Question'
        )}
      </button>
    </form>
  );
};

export default QuestionForm;