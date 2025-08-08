import { useState, useEffect } from 'react';
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
}

export type ProfileData = Omit<RestaurantProfile, 'id' | 'ownerId' | 'slug'>;

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
  const [isLoading, setIsLoading] = useState(true);

  // Real-time listener for the user's restaurant profile
  useEffect(() => {
    if (authLoading || !user) {
        if(!authLoading) setIsLoading(false);
        return;
    }

    // The document ID for the restaurant is the user's UID for easy lookup
    const docRef = doc(db, 'restaurants', user.uid);

    const unsubscribe = onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          setProfile({ id: doc.id, ...doc.data() } as RestaurantProfile);
        } else {
          setProfile(null); // No profile exists yet
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
  }, [user, authLoading]);

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

  return { profile, isLoading: authLoading || isLoading, saveProfile };
};
