"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Loading from "@/app/components/shared/Loading";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "owner" | "waiter" | "driver";
  fallback?: React.ReactNode;
}

interface UserProfile {
  role: "owner" | "waiter" | "driver";
  restaurantId?: string;
  [key: string]: any;
}

export default function AuthGuard({
  children,
  requiredRole,
  fallback,
}: AuthGuardProps) {
  const [user, authLoading] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setIsProfileLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // User is not authenticated, redirect to appropriate login page
      const currentPath = window.location.pathname;
      let loginUrl = "/sign-in";

      if (currentPath.startsWith("/waiter/")) {
        loginUrl = "/waiter-login";
      } else if (currentPath.startsWith("/driver/")) {
        loginUrl = "/driver-login";
      } else if (currentPath.startsWith("/dashboard/")) {
        loginUrl = "/sign-in";
      }

      router.push(loginUrl);
      return;
    }

    // User is authenticated, fetch their profile
    const fetchUserProfile = async () => {
      try {
        setIsProfileLoading(true);

        // Check if user exists in any of the collections
        const collections = ["users", "waiters", "drivers"];
        let profile: UserProfile | null = null;

        for (const collection of collections) {
          const docRef = doc(db, collection, user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();

            // Determine role based on collection
            if (collection === "users") {
              profile = { ...data, role: "owner" } as UserProfile;
            } else if (collection === "waiters") {
              profile = { ...data, role: "waiter" } as UserProfile;
            } else if (collection === "drivers") {
              profile = { ...data, role: "driver" } as UserProfile;
            }
            break;
          }
        }

        if (!profile) {
          // User doesn't exist in any collection, redirect to sign-up
          router.push("/sign-up");
          return;
        }

        setUserProfile(profile);

        // Check if user has the required role
        if (requiredRole && profile.role !== requiredRole) {
          // User doesn't have the required role, redirect to appropriate page
          if (profile.role === "waiter") {
            router.push("/waiter/dashboard");
          } else if (profile.role === "driver") {
            router.push("/driver/dashboard");
          } else if (profile.role === "owner") {
            router.push("/dashboard");
          }
          return;
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        router.push("/sign-in");
      } finally {
        setIsProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, authLoading, router, requiredRole]);

  // Show loading while checking authentication
  if (authLoading || profileLoading) {
    return fallback || <Loading />;
  }

  // Show loading while redirecting
  if (!user || !userProfile) {
    return fallback || <Loading />;
  }

  // Check if user has the required role
  if (requiredRole && userProfile.role !== requiredRole) {
    return fallback || <Loading />;
  }

  // User is authenticated and has the required role, render children
  return <>{children}</>;
}
