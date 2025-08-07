'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../lib/firebase'; // Adjust path as needed
import { LoaderCircle } from 'lucide-react';

// This is the layout that will protect all routes inside the (dashboard) group.

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User is signed in.
        setUser(currentUser);
      } else {
        // User is signed out.
        // Redirect them to the sign-in page.
        router.push('/sign-in');
      }
      // Finished checking auth state
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]); // Add router to dependency array

  // While we're checking the user's authentication status, show a loading screen.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
            <LoaderCircle className="w-12 h-12 text-red-600 animate-spin" />
            <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If the user is authenticated (and we're no longer loading), render the children.
  // The redirect for unauthenticated users happens inside the useEffect.
  if (user) {
    return <>{children}</>;
  }

  // This return is technically not reached if the redirect works,
  // but it's good practice to have a fallback.
  return null;
}
