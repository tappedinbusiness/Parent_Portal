
import { useState, useEffect } from 'react';
// FIX: Updated to use Firebase compat API to match the project's setup and resolve import errors.
import type firebase from 'firebase/compat/app';
import { auth } from '../services/firebase';

export const useAuth = () => {
  // FIX: Use User type from compat API.
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // FIX: Use compat API calls.
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    auth.signInAnonymously().catch((error) => {
      console.error("Anonymous sign-in failed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};
