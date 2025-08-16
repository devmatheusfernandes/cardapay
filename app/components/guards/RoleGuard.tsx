"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Loading from "@/app/components/shared/Loading";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ("owner" | "waiter" | "driver")[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export default function RoleGuard({
  children,
  allowedRoles,
  fallback,
  redirectTo,
}: RoleGuardProps) {
  const [user, authLoading] = useAuthState(auth);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // User is not authenticated, redirect to sign-in
      router.push("/sign-in");
      return;
    }

    // Fetch user role
    const fetchUserRole = async () => {
      try {
        setIsLoading(true);

        // Check if user exists in any of the collections
        const collections = ["users", "waiters", "drivers"];
        let role: string | null = null;

        for (const collection of collections) {
          const docRef = doc(db, collection, user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            // Determine role based on collection
            if (collection === "users") {
              role = "owner";
            } else if (collection === "waiters") {
              role = "waiter";
            } else if (collection === "drivers") {
              role = "driver";
            }
            break;
          }
        }

        if (!role) {
          // User doesn't exist in any collection
          router.push("/sign-up");
          return;
        }

        setUserRole(role);

        // Check if user has an allowed role
        if (!allowedRoles.includes(role as any)) {
          // User doesn't have permission, redirect
          if (redirectTo) {
            router.push(redirectTo);
          } else {
            // Default redirect based on role
            if (role === "waiter") {
              router.push("/waiter/dashboard");
            } else if (role === "driver") {
              router.push("/driver/dashboard");
            } else if (role === "owner") {
              router.push("/dashboard");
            }
          }
          return;
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        router.push("/sign-in");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user, authLoading, router, allowedRoles, redirectTo]);

  // Show loading while checking authentication and role
  if (authLoading || isLoading) {
    return fallback || <Loading />;
  }

  // Show loading while redirecting
  if (!user || !userRole) {
    return fallback || <Loading />;
  }

  // Check if user has an allowed role
  if (!allowedRoles.includes(userRole as any)) {
    return fallback || <Loading />;
  }

  // User is authenticated and has an allowed role, render children
  return <>{children}</>;
}
