"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useSubscription } from "./useSubscription";
import { useRestaurantProfile } from "./useRestaurantProfile";

export const useOnboarding = () => {
  const [user, authLoading] = useAuthState(auth);
  const { subscription, isActive } = useSubscription();
  const { profile } = useRestaurantProfile();
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    // Check if user should see welcome modal
    const checkWelcomeStatus = async () => {
      try {
        // Check if user has an active subscription (paid or trial)
        if (isActive) {
          // Check if profile is incomplete
          const hasEmailVerified = !!user?.emailVerified;
          const hasBasicProfile = !!(profile?.name && profile?.address && profile?.description);
          const hasWorkingHours = !!(profile?.workingHours);
          const hasStripeAccount = !!(profile?.stripeAccountId);
          
          // If any required field is missing, show welcome modal
          if (!hasEmailVerified || !hasBasicProfile || !hasWorkingHours || !hasStripeAccount) {
            setShouldShowWelcome(true);
          } else {
            setShouldShowWelcome(false);
          }
        } else {
          setShouldShowWelcome(false);
        }
      } catch (error) {
        console.error("Error checking welcome status:", error);
        setShouldShowWelcome(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkWelcomeStatus();
  }, [user, authLoading, isActive, profile]);

  const markWelcomeAsSeen = () => {
    setShouldShowWelcome(false);
    // Optionally save to localStorage to remember user has seen it
    if (typeof window !== "undefined") {
      localStorage.setItem("welcomeModalSeen", "true");
    }
  };

  const checkIfWelcomeSeen = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("welcomeModalSeen") === "true";
    }
    return false;
  };

  return {
    shouldShowWelcome: shouldShowWelcome && !checkIfWelcomeSeen(),
    markWelcomeAsSeen,
    isLoading: authLoading || isLoading
  };
};
