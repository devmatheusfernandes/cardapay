import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { toast } from 'react-hot-toast';

export interface ClientProfile {
  name: string;
  email: string;
  defaultAddress?: string;
  phone?: string;
}

export const useClientProfile = () => {
  const [user, authLoading] = useAuthState(auth);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "clients", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const profileData: ClientProfile = {
          name: data.name || "",
          email: data.email || "",
          defaultAddress: data.defaultAddress || "",
          phone: data.phone || "",
        };
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching client profile:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const updateProfile = async (updates: Partial<ClientProfile>) => {
    if (!user) {
      toast.error("Você precisa estar logado para atualizar o perfil");
      return false;
    }

    try {
      const toastId = toast.loading("Salvando perfil...");
      
      await updateDoc(doc(db, "clients", user.uid), updates);
      
      toast.success("Perfil atualizado com sucesso!", { id: toastId });
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
      return false;
    }
  };

  const updateDefaultAddress = async (address: string) => {
    return updateProfile({ defaultAddress: address });
  };

  return {
    profile,
    isLoading: authLoading || isLoading,
    updateProfile,
    updateDefaultAddress,
  };
};
