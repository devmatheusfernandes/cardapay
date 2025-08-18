import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { safeTimestampToDate } from '../utils/timestamp';

export interface FavoriteRestaurant {
  id: string;
  name: string;
  address?: string;
  description?: string;
  logoUrl?: string;
  slug?: string;
  rating?: {
    average: number;
    count: number;
  };
  favoritedAt: Date;
}

export const useClientFavorites = () => {
  const [user] = useAuthState(auth);
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's favorite restaurants
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Listen to changes in user's favorites
    const unsubscribe = onSnapshot(
      query(
        collection(db, "favorites"),
        where("userId", "==", user.uid)
      ),
      async (snapshot) => {
        try {
          const favoritesData: FavoriteRestaurant[] = [];
          
          for (const favoriteDoc of snapshot.docs) {
            const favoriteData = favoriteDoc.data();
            const restaurantId = favoriteData.restaurantId;
            
            // Get restaurant details
            const restaurantRef = doc(db, "restaurants", restaurantId);
            const restaurantSnap = await getDoc(restaurantRef);
            
            if (restaurantSnap.exists()) {
              const restaurantData = restaurantSnap.data();
              
              // Get restaurant rating
              const reviewsQuery = query(
                collection(db, "reviews"),
                where("restaurantId", "==", restaurantId)
              );
              const reviewsSnapshot = await getDocs(reviewsQuery);
              
              let rating;
              if (!reviewsSnapshot.empty) {
                let totalRating = 0;
                let reviewCount = 0;
                
                reviewsSnapshot.forEach((reviewDoc) => {
                  const review = reviewDoc.data();
                  if (review.rating) {
                    totalRating += review.rating;
                    reviewCount++;
                  }
                });
                
                if (reviewCount > 0) {
                  rating = {
                    average: Math.round((totalRating / reviewCount) * 10) / 10,
                    count: reviewCount
                  };
                }
              }
              
              favoritesData.push({
                id: restaurantId,
                name: restaurantData.name,
                address: restaurantData.address,
                description: restaurantData.description,
                logoUrl: restaurantData.logoUrl,
                slug: restaurantData.slug,
                rating,
                favoritedAt: favoriteData.createdAt ? safeTimestampToDate(favoriteData.createdAt) : new Date()
              });
            }
          }
          
          // Sort by most recently favorited
          favoritesData.sort((a, b) => b.favoritedAt.getTime() - a.favoritedAt.getTime());
          
          setFavorites(favoritesData);
        } catch (error) {
          console.error("Error fetching favorites:", error);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Error listening to favorites:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Add restaurant to favorites
  const addToFavorites = async (restaurantId: string) => {
    if (!user) {
      throw new Error("User must be logged in to add favorites");
    }

    try {
      const favoriteRef = doc(db, "favorites", `${user.uid}_${restaurantId}`);
      await setDoc(favoriteRef, {
        userId: user.uid,
        restaurantId,
        createdAt: new Date()
      });
    } catch (error) {
      console.error("Error adding to favorites:", error);
      throw error;
    }
  };

  // Remove restaurant from favorites
  const removeFromFavorites = async (restaurantId: string) => {
    if (!user) {
      throw new Error("User must be logged in to remove favorites");
    }

    try {
      const favoriteRef = doc(db, "favorites", `${user.uid}_${restaurantId}`);
      await deleteDoc(favoriteRef);
    } catch (error) {
      console.error("Error removing from favorites:", error);
      throw error;
    }
  };

  // Check if a restaurant is favorited
  const isFavorited = (restaurantId: string) => {
    return favorites.some(fav => fav.id === restaurantId);
  };

  // Get total favorites count
  const getTotalFavorites = () => {
    return favorites.length;
  };

  return {
    favorites,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    isFavorited,
    getTotalFavorites
  };
};
