import React from 'react';
import { SignedIn, SignedOut, SignInButton, useUser, SignOutButton } from '@clerk/clerk-react';

const Account: React.FC = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <SignedOut>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Account</h2>
        <p className="text-gray-600 mb-4">You are not signed in. Please sign in to view your profile.</p>
        <SignInButton mode="redirect">
          <button className="px-4 py-2 bg-red-800 text-white rounded-md">Sign In</button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">My Profile</h2>
        {isSignedIn && user && (
          <div className="flex items-center space-x-4">
            <img src={(user as any).imageUrl || (user as any).profileImageUrl || '/assets/default-avatar.png'} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
            <div>
              <div className="text-lg font-semibold text-gray-800">{user.fullName || user.firstName || 'User'}</div>
              <div className="text-sm text-gray-600">{user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress}</div>
              <div className="mt-3">
                <SignOutButton>
                  <button className="px-3 py-1 bg-gray-100 border rounded text-sm">Sign out</button>
                </SignOutButton>
              </div>
            </div>
          </div>
        )}
      </SignedIn>
    </div>
  );
};

export default Account;
