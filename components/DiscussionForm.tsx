import React, { useState } from 'react';
import Spinner from './Spinner';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';

interface DiscussionFormProps {
  onSubmit: (topic: string) => Promise<boolean>;
}

const DiscussionForm: React.FC<DiscussionFormProps> = ({ onSubmit }) => {
  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Discussion topic cannot be empty.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      const success = await onSubmit(topic);
      if (success) {
        setTopic('');
      }
    } catch (err) {
      console.error("Submission failed:", err);
      setError('Failed to submit your discussion. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <>
      <SignedOut>
        <div className="bg-white p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-2">You are not signed in</h3>
          <p className="text-sm text-gray-600 mb-3">Sign in to start a discussion.</p>
          <SignInButton mode="redirect">
            <button className="px-4 py-2 bg-red-800 text-white rounded-md">Sign In</button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-700 focus:border-indigo-700 transition duration-200 resize-none"
            placeholder="e.g., What are the best off-campus housing options for sophomores?"
            value={topic}
            onChange={(e) => {
                setTopic(e.target.value)
                if(error) setError(null);
            }}
            disabled={isSubmitting}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting || !topic.trim()}
            className="mt-4 w-full flex justify-center items-center bg-indigo-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Spinner />
                <span>Submitting for Review...</span>
              </>
            ) : (
              'Start Discussion'
            )}
          </button>
        </form>
      </SignedIn>
    </>
  );
};

export default DiscussionForm;