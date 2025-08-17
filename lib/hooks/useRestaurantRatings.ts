import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

export interface RestaurantRating {
  average: number;
  count: number;
}

export interface RestaurantFavorite {
  count: number;
  isFavorited: boolean;
}

export const useRestaurantRatings = (restaurantIds: string[]) => {
  const [user] = useAuthState(auth);
  const [ratings, setRatings] = useState<{[key: string]: RestaurantRating}>({});
  const [favorites, setFavorites] = useState<{[key: string]: RestaurantFavorite}>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch ratings for all restaurants
  useEffect(() => {
    const fetchRatings = async () => {
      if (restaurantIds.length === 0) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const ratingsData: {[key: string]: RestaurantRating} = {};
        
        for (const restaurantId of restaurantIds) {
          const reviewsQuery = query(
            collection(db, "reviews"),
            where("restaurantId", "==", restaurantId)
          );
          const reviewsSnapshot = await getDocs(reviewsQuery);
          
          if (!reviewsSnapshot.empty) {
            let totalRating = 0;
            let reviewCount = 0;
            
            reviewsSnapshot.forEach((doc) => {
              const review = doc.data();
              if (review.rating) {
                totalRating += review.rating;
                reviewCount++;
              }
            });
            
            if (reviewCount > 0) {
              ratingsData[restaurantId] = {
                average: Math.round((totalRating / reviewCount) * 10) / 10,
                count: reviewCount
              };
            }
          }
        }
        
        setRatings(ratingsData);
      } catch (error) {
        console.error("Error fetching ratings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRatings();
  }, [restaurantIds]);

// Fetch favorites for all restaurants
useEffect(() => {
  const fetchFavorites = async () => {
    if (restaurantIds.length === 0) return;
    
    try {
      const favoritesData: {[key: string]: RestaurantFavorite} = {};
      
      for (const restaurantId of restaurantIds) {
        // Check if current user has favorited this restaurant
        let isFavorited = false;
        if (user) {
          try {
            const favoriteDocRef = doc(db, "favorites", `${user.uid}_${restaurantId}`);
            const favoriteDoc = await getDoc(favoriteDocRef);
            isFavorited = favoriteDoc.exists();
          } catch (error) {
            console.error(`Error checking favorite for restaurant ${restaurantId}:`, error);
            isFavorited = false;
          }
        }
        
        favoritesData[restaurantId] = {
          count: 0, // Remove count functionality
          isFavorited
        };
      }
      
      setFavorites(favoritesData);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  fetchFavorites();
}, [restaurantIds, user]);

  // Toggle favorite for a restaurant
  const toggleFavorite = async (restaurantId: string) => {
    if (!user) {
      throw new Error("User must be logged in to favorite restaurants");
    }

    try {
      const favoriteRef = doc(db, "favorites", `${user.uid}_${restaurantId}`);
      const currentFavorite = favorites[restaurantId];
      
      if (currentFavorite?.isFavorited) {
        // Remove from favorites
        await deleteDoc(favoriteRef);
        setFavorites(prev => ({
          ...prev,
          [restaurantId]: {
            count: Math.max(0, (prev[restaurantId]?.count || 0) - 1),
            isFavorited: false
          }
        }));
      } else {
        // Add to favorites
        await setDoc(favoriteRef, {
          userId: user.uid,
          restaurantId,
          createdAt: new Date()
        });
        setFavorites(prev => ({
          ...prev,
          [restaurantId]: {
            count: (prev[restaurantId]?.count || 0) + 1,
            isFavorited: true
          }
        }));
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      throw error;
    }
  };

  // Get total ratings count
  const getTotalRatings = () => {
    return Object.values(ratings).reduce((sum, rating) => sum + rating.count, 0);
  };

  // Get total favorites count
  const getTotalFavorites = () => {
    return Object.values(favorites).reduce((sum, fav) => sum + fav.count, 0);
  };

  // Get average rating across all restaurants
  const getAverageRating = () => {
    const totalRating = Object.values(ratings).reduce((sum, rating) => sum + rating.average, 0);
    const restaurantCount = Object.keys(ratings).length;
    return restaurantCount > 0 ? Math.round((totalRating / restaurantCount) * 10) / 10 : 0;
  };

  return {
    ratings,
    favorites,
    isLoading,
    toggleFavorite,
    getTotalRatings,
    getTotalFavorites,
    getAverageRating
  };
};
