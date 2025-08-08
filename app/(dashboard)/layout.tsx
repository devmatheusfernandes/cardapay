'use client';

import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from '@/app/components/shared/Sidebar';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
            <LoaderCircle className="w-12 h-12 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null; // Render nothing while redirecting
  }

  // If the user is authenticated, render the dashboard layout
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* The Toaster is now here, available to all dashboard pages */}
        <Toaster position="top-center" reverseOrder={false} />
        {children}
      </main>
    </div>
  );
}
