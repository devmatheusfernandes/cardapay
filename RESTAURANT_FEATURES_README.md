# Restaurant Rating & Favorites System

This document describes the restaurant rating and favorites system implemented in the CardaPay application.

## Overview

The system allows users to:

- View restaurant ratings based on customer reviews
- Mark restaurants as favorites
- Sort restaurants by rating, favorites, or name
- See statistics about total ratings and favorites

## Features

### 1. Restaurant Ratings

#### Rating Calculation

- Ratings are calculated from customer reviews in the `reviews` collection
- Each review contains a `rating` (1-5 stars) and `restaurantId`
- Average rating is calculated and rounded to 1 decimal place
- Total review count is displayed alongside the rating

#### Rating Display

- **With Ratings**: Shows star rating (visual stars + number) and review count
- **Without Ratings**: Shows "Sem avaliações" (No ratings) message
- Uses a custom `RatingStars` component for visual star representation

#### Data Source

Ratings come from the order tracking system where customers can rate their experience after completing an order.

### 2. Restaurant Favorites

#### Favorites System

- Users can mark restaurants as favorites by clicking the heart icon
- Favorites are stored in the `favorites` collection
- Each favorite document has: `userId`, `restaurantId`, `createdAt`
- Document ID format: `${userId}_${restaurantId}`

#### Favorites Display

- Heart icon shows filled (red) when favorited, empty (gray) when not
- Shows total count of people who favorited each restaurant
- Real-time updates when toggling favorites

#### Authentication Required

- Users must be logged in to favorite restaurants
- Unauthenticated users see an error message when trying to favorite

### 3. Sorting & Filtering

#### Sort Options

1. **Nome** (Name) - Alphabetical order
2. **Melhor Avaliados** (Best Rated) - By average rating (highest first)
3. **Mais Favoritados** (Most Favorited) - By total favorites count (highest first)

#### Filter Options

- **Com Avaliações** (With Ratings) - Shows count of restaurants with ratings
- Search functionality filters by name, address, and description

### 4. Statistics Dashboard

#### Summary Cards

- **Restaurantes**: Total number of restaurants
- **Avaliações**: Total number of reviews across all restaurants
- **Favoritos**: Total number of favorites across all restaurants

## Technical Implementation

### Custom Hook: `useRestaurantRatings`

```typescript
export const useRestaurantRatings = (restaurantIds: string[]) => {
  // Returns:
  // - ratings: {[restaurantId]: { average: number, count: number }}
  // - favorites: {[restaurantId]: { count: number, isFavorited: boolean }}
  // - toggleFavorite: Function to add/remove favorites
  // - getTotalRatings: Function to get total review count
  // - getTotalFavorites: Function to get total favorites count
};
```

### Database Collections

#### `reviews` Collection

```typescript
{
  restaurantId: string;
  orderId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Timestamp;
  userId: string;
}
```

#### `favorites` Collection

```typescript
{
  userId: string;
  restaurantId: string;
  createdAt: Timestamp;
}
```

### Components

#### `RatingStars`

- Reusable component for displaying star ratings
- Supports different sizes (sm, md, lg)
- Shows half-stars for decimal ratings
- Optional number display

#### `RestaurantsPage`

- Main page displaying all restaurants
- Integrates ratings and favorites
- Handles sorting and filtering
- Shows statistics summary

## User Experience

### Visual Design

- **Ratings**: Amber stars with review count
- **Favorites**: Red heart icons with favorite count
- **Statistics**: Color-coded summary cards
- **Sorting**: Active sort button highlighted in emerald

### Interactions

- **Favorite Toggle**: Click heart icon to add/remove from favorites
- **Sorting**: Click sort buttons to change restaurant order
- **Search**: Real-time filtering as you type
- **Responsive**: Works on mobile and desktop

### Feedback

- Toast notifications for favorite actions
- Loading states during data fetching
- Error handling for authentication issues

## Future Enhancements

### Planned Features

1. **Advanced Filtering**: Filter by rating range, cuisine type, location
2. **User Favorites Page**: Dedicated page showing user's favorite restaurants
3. **Rating Analytics**: Charts showing rating distribution
4. **Review Management**: Allow users to edit/delete their reviews
5. **Restaurant Response**: Allow restaurants to respond to reviews

### Potential Improvements

1. **Caching**: Implement Redis caching for ratings and favorites
2. **Real-time Updates**: WebSocket integration for live updates
3. **Rating Verification**: Ensure only customers who ordered can rate
4. **Spam Protection**: Rate limiting and review validation
5. **Multi-language**: Support for different languages in reviews

## Security Considerations

### Data Validation

- Ratings must be between 1-5
- Users can only favorite once per restaurant
- Reviews are linked to actual orders

### Access Control

- Favorites require user authentication
- Users can only see their own favorites
- Restaurant owners cannot manipulate ratings

### Rate Limiting

- Consider implementing rate limiting for favorites
- Prevent spam favoriting

## Performance Optimizations

### Current Implementation

- Batch fetching of ratings and favorites
- Memoized sorting and filtering
- Efficient database queries with indexes

### Future Optimizations

- Implement pagination for large restaurant lists
- Cache frequently accessed ratings
- Lazy load restaurant images
- Use React Query for better data management

## Testing

### Test Cases

1. **Rating Display**: Verify correct rating calculation and display
2. **Favorites Toggle**: Test add/remove functionality
3. **Sorting**: Verify all sort options work correctly
4. **Authentication**: Test behavior for logged out users
5. **Error Handling**: Test network failures and edge cases

### Test Data

- Create test restaurants with various ratings
- Add test favorites for different users
- Test with restaurants having no ratings

## Deployment Notes

### Environment Variables

- Ensure Firebase configuration is correct
- Verify Firestore security rules allow read access to reviews and favorites

### Database Indexes

- Create composite indexes for efficient queries:
  - `reviews`: `restaurantId` + `rating`
  - `favorites`: `restaurantId` + `userId`

### Monitoring

- Track rating and favorite creation rates
- Monitor database query performance
- Set up alerts for unusual activity
