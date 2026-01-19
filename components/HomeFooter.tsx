import React from 'react';

const HomeFooter: React.FC<{ onOpenTerms: () => void }> = ({ onOpenTerms }) => {
  return (
    <footer className="mt-10 text-xs text-gray-500">
      <div className="border-t pt-4">
        <div className="mb-2">
          CollegeAsk.org is operated by TappedIn Incorporated and provides general informational content and user-generated discussions that are not guaranteed to be accurate, complete, or current and do not constitute professional, academic, legal, financial, or institutional advice. Use of this site is subject to our Terms of Service, Privacy Policy, and Community Guidelines, and all reliance on site content is at your own risk.
        </div>
        <button
          type="button"
          onClick={onOpenTerms}
          className="text-red-800 hover:underline"
        >
          View Terms of Service
        </button>
      </div>
    </footer>
  );
};

export default HomeFooter;