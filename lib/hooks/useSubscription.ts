// lib/hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';

export interface SubscriptionStatus {
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
  startDate?: string;
  endDate?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  isLoading: boolean;
}

export function useSubscription() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    status: null,
    isLoading: true
  });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = (user: User) => {
      const userDocRef = doc(db, 'users', user.uid);
      
      unsubscribe = onSnapshot(userDocRef, (doc) => {
        const data = doc.data();
        
        setSubscriptionStatus({
          status: data?.subscriptionStatus || null,
          startDate: data?.subscriptionStartDate,
          endDate: data?.subscriptionEndDate,
          stripeCustomerId: data?.stripeCustomerId,
          stripeSubscriptionId: data?.stripeSubscriptionId,
          isLoading: false
        });
      }, (error) => {
        console.error('Error listening to subscription status:', error);
        setSubscriptionStatus(prev => ({ ...prev, isLoading: false }));
      });
    };

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setupSubscription(user);
      } else {
        setSubscriptionStatus({
          status: null,
          isLoading: false
        });
      }
    });

    return () => {
      authUnsubscribe();
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const isActive = () => {
    return subscriptionStatus.status === 'active' || subscriptionStatus.status === 'trialing';
  };

  const isExpired = () => {
    if (!subscriptionStatus.endDate) return false;
    return new Date(subscriptionStatus.endDate) < new Date();
  };

  const getDaysUntilExpiry = () => {
    if (!subscriptionStatus.endDate) return null;
    const endDate = new Date(subscriptionStatus.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return {
    ...subscriptionStatus,
    isActive: isActive(),
    isExpired: isExpired(),
    daysUntilExpiry: getDaysUntilExpiry(),
    refresh: () => {
      // Force refresh by updating the user doc listener
      const user = auth.currentUser;
      if (user) {
        setSubscriptionStatus(prev => ({ ...prev, isLoading: true }));
      }
    }
  };
}