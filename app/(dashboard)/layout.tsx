"use client";

import { ReactNode, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/app/components/shared/Sidebar";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  // FIX: Handle navigation as a side effect inside useEffect
  useEffect(() => {
    // If loading is finished and there's no user, redirect to sign-in
    if (!loading && !user) {
      router.push("/sign-in");
    }
  }, [user, loading, router]); // Dependencies ensure this runs when auth state changes

  if (loading || !user) {
    // Show a loading spinner while checking for a user or during redirection
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="w-12 h-12 text-emerald-600 animate-spin" />
        </div>
      </div>
    );
  }

  // If the user is authenticated, render the dashboard layout
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Toaster position="top-center" reverseOrder={false} />
        {children}
      </main>
    </div>
  );
}
