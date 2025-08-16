import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export const useDriverSelfRemove = () => {
  const [user, authLoading] = useAuthState(auth);
  const [isRemoving, setIsRemoving] = useState(false);

  const removeSelfFromRestaurant = async () => {
    if (!user) {
      toast.error("You must be logged in.");
      return;
    }

    setIsRemoving(true);
    const toastId = toast.loading('Removendo do restaurante...');
    
    try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/drivers/self-remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to remove from restaurant.");
        }

        toast.success(result.message, { id: toastId });

    } catch (error: any) {
        console.error("Error removing self from restaurant:", error);
        toast.error(error.message, { id: toastId });
        throw error;
    } finally {
        setIsRemoving(false);
    }
  };

  return { removeSelfFromRestaurant, isRemoving, authLoading };
};
