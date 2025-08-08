import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { db, auth, storage } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuthState } from 'react-firebase-hooks/auth';

export interface RestaurantProfile {
  id: string;
  name: string;
  address: string;
  slug: string;
  logoUrl?: string;
  logoPath?: string;
  ownerId: string;
  stripeAccountId?: string;
}

export interface StripeAccountStatus {
    status: 'connected' | 'not_connected';
    details_submitted: boolean;
    payouts_enabled: boolean;
    charges_enabled: boolean;
}

export type ProfileData = Omit<RestaurantProfile, 'id' | 'ownerId' | 'slug' | 'stripeAccountId'>;

// Helper function to generate a URL-friendly slug
const generateSlug = (name: string) => {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')         // Replace spaces with hyphens
        .substring(0, 50) + '-' + randomSuffix;
};

export const useRestaurantProfile = () => {
  const [user, authLoading] = useAuthState(auth);
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeAccountStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStripeStatus = useCallback(async () => {
    if (!user) return;
    try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/stripe-connect/get-account-status', {
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            setStripeStatus(data);
        }
    } catch (error) {
        console.error("Failed to fetch Stripe status:", error);
    }
  }, [user]);

  // Real-time listener for the user's restaurant profile
  useEffect(() => {
    if (authLoading || !user) {
        if(!authLoading) setIsLoading(false);
        return;
    }

    const docRef = doc(db, 'restaurants', user.uid);

    const unsubscribe = onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          const profileData = { id: doc.id, ...doc.data() } as RestaurantProfile;
          setProfile(profileData);
          if (profileData.stripeAccountId) {
            fetchStripeStatus();
          } else {
            // FIX: Explicitly set status when no Stripe account is linked
            setStripeStatus({ status: 'not_connected', details_submitted: false, payouts_enabled: false, charges_enabled: false });
          }
        } else {
          setProfile(null);
          // FIX: Explicitly set status when no profile exists at all
          setStripeStatus({ status: 'not_connected', details_submitted: false, payouts_enabled: false, charges_enabled: false });
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching profile:", error);
        toast.error("Could not fetch your profile.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, fetchStripeStatus]);

  // Function to save the restaurant profile
  const saveProfile = async (data: ProfileData, logoFile: File | null) => {
    if (!user) {
      toast.error("You must be logged in.");
      return;
    }

    const toastId = toast.loading('Saving profile...');

    try {
      let logoUrl = profile?.logoUrl || '';
      let logoPath = profile?.logoPath || '';

      if (logoFile) {
        const filePath = `logos/${user.uid}/${Date.now()}_${logoFile.name}`;
        const storageRef = ref(storage, filePath);
        const uploadResult = await uploadBytes(storageRef, logoFile);
        logoUrl = await getDownloadURL(uploadResult.ref);
        logoPath = filePath;
      }
      
      const docRef = doc(db, 'restaurants', user.uid);
      
      if (profile) {
        // Profile exists, update it
        await updateDoc(docRef, { ...data, logoUrl, logoPath });
      } else {
        // Profile doesn't exist, create it with a new slug
        const newSlug = generateSlug(data.name);
        await setDoc(docRef, { 
            ...data, 
            logoUrl, 
            logoPath, 
            slug: newSlug, 
            ownerId: user.uid 
        });
      }

      toast.success('Profile saved successfully!', { id: toastId });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error('Failed to save profile.', { id: toastId });
    }
  };

  return { profile, stripeStatus, isLoading: authLoading || isLoading, saveProfile };
};
