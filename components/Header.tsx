import React from 'react';

interface HeaderProps {
    currentPage: 'home' | 'forum' | 'admin';
    setPage: (page: 'home' | 'forum' | 'admin') => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, setPage }) => {
  const navLinkClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const activeClasses = "bg-red-100 text-red-800";
  const inactiveClasses = "text-gray-600 hover:bg-gray-100 hover:text-gray-900";

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
            <div className="bg-red-800 text-white font-bold text-2xl w-14 h-14 flex items-center justify-center rounded-full mr-4">
            UA
            </div>
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
                onClick={() => setPage('admin')}
                className={`${navLinkClasses} ${currentPage === 'admin' ? activeClasses : inactiveClasses}`}
            >
                Admin
            </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;