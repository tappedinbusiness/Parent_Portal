import React from 'react';
import { useUser } from '@clerk/clerk-react';
import tappedinLogo from '../assets/tappedinlogo.svg.png';

interface HeaderProps {
    currentPage: 'home' | 'forum' | 'account';
    setPage: (page: 'home' | 'forum' | 'account') => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, setPage }) => {
  const navLinkClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const activeClasses = "bg-red-100 text-red-800";
  const inactiveClasses = "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
  const { isLoaded, isSignedIn, user } = useUser();

  const accountLabel = isLoaded && isSignedIn && user ? `👋 Hello, ${user.firstName || user.fullName || 'User'}` : 'Sign In';

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
            <img src={tappedinLogo} className="w-16 h-16"></img>
            <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                University of Alabama
            </h1>
            <p className="text-md text-gray-600">Parent Forum AI Assistant</p>
            </div>
        </div>
        <nav className="flex items-center space-x-2">
            <button 
                onClick={() => setPage('home')}
                className={`${navLinkClasses} ${currentPage === 'home' ? activeClasses : inactiveClasses}`} 
            >
                Home
            </button>
            <button 
                onClick={() => setPage('forum')}
                className={`${navLinkClasses} ${currentPage === 'forum' ? activeClasses : inactiveClasses}`}
            >
                Forum
            </button>
            <button 
                onClick={() => setPage('account')}
                className={`${navLinkClasses} ${currentPage === 'account' ? activeClasses : inactiveClasses}`}
            >
                {accountLabel}
            </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;