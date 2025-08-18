# Default Address Feature Implementation

This document describes the implementation of the default address feature for clients in the CardaPay application.

## Overview

The feature allows clients to:

1. Set a default delivery address in their profile
2. Use this default address when placing delivery orders
3. Still have the option to enter a different address for specific orders

## Implementation Details

### 1. Client Profile Management

#### New Hook: `useClientProfile`

- **File**: `lib/hooks/useClientProfile.ts`
- **Purpose**: Manages client profile data including default address
- **Features**:
  - Real-time profile updates via Firestore listener
  - Profile update functions
  - Default address management

#### Client Dashboard Updates

- **File**: `app/client/dashboard/page.tsx`
- **New Tab**: "Profile" tab added alongside "Favorites" and "Orders"
- **Features**:
  - Edit profile information (name, phone, default address)
  - Real-time profile updates
  - Form validation and error handling

### 2. Address Form Enhancement

#### Updated AddressForm Component

- **File**: `app/components/restaurantSlug/AddressForm.tsx`
- **New Features**:
  - Option to use default address when available
  - Visual indication of selected address option
  - Disabled manual form when using default address
  - Easy switching between default and manual address

#### User Experience

- **Default Address Option**: Prominently displayed at the top when available
- **Manual Address**: Still available for one-time use
- **Visual Feedback**: Clear indication of which option is selected
- **Smooth Transitions**: Animated form state changes

### 3. Client Registration

#### Enhanced Signup Form

- **File**: `app/(auth)/client-signup/page.tsx`
- **New Field**: Default address input (optional)
- **Features**:
  - Textarea for full address input
  - Helpful placeholder text
  - Icon integration (MapPin)
  - Explanatory text about usage

## Database Schema

### Clients Collection

```typescript
interface ClientProfile {
  name: string;
  email: string;
  defaultAddress?: string; // New field
  phone?: string;
  createdAt: Timestamp;
  role: "client";
}
```

## User Flow

### 1. Setting Default Address

1. Client signs up (optional during signup)
2. Client navigates to Profile tab in dashboard
3. Client edits profile and adds/saves default address
4. Address is stored in Firestore

### 2. Using Default Address

1. Client adds items to cart
2. Client selects delivery option
3. If default address exists, option is shown prominently
4. Client can choose to use default or enter new address
5. Selected address is used for order processing

### 3. Managing Address

1. Client can update default address anytime in profile
2. Changes are reflected immediately in delivery forms
3. Previous orders retain their original addresses

## Technical Implementation

### State Management

- **Local State**: Form inputs and UI state
- **Firestore**: Persistent storage with real-time updates
- **Context**: Cart context for delivery address

### Real-time Updates

- Firestore listeners for profile changes
- Immediate UI updates when profile changes
- Optimistic updates for better UX

### Error Handling

- Form validation
- Firestore operation error handling
- User-friendly error messages
- Fallback to manual address entry

## Benefits

### For Clients

- **Convenience**: No need to re-enter address for each order
- **Speed**: Faster checkout process
- **Accuracy**: Consistent address format
- **Flexibility**: Still can use different addresses when needed

### For Restaurants

- **Reduced Errors**: Fewer address-related delivery issues
- **Faster Processing**: Clearer delivery information
- **Better Customer Experience**: Satisfied customers return more

## Future Enhancements

### Potential Improvements

1. **Multiple Addresses**: Allow clients to save multiple addresses
2. **Address Validation**: Integration with address validation services
3. **Geolocation**: Auto-detect current location
4. **Address History**: Track previously used addresses
5. **Smart Suggestions**: AI-powered address completion

### Technical Improvements

1. **Caching**: Local storage for offline access
2. **Optimization**: Reduce Firestore reads
3. **Analytics**: Track address usage patterns
4. **Testing**: Comprehensive test coverage

## Testing Considerations

### Test Cases

1. **Profile Management**: Add, edit, delete default address
2. **Order Flow**: Use default address in delivery orders
3. **Edge Cases**: No default address, invalid addresses
4. **Real-time Updates**: Profile changes reflect immediately
5. **Error Handling**: Network failures, validation errors

### Test Scenarios

1. **New User**: Signup with/without default address
2. **Existing User**: Add default address to existing profile
3. **Address Updates**: Modify existing default address
4. **Order Processing**: Complete orders with default address
5. **Fallback**: Manual address entry when default unavailable

## Security Considerations

### Data Protection

- Client can only access their own profile
- Address data is private to the client
- No sharing of address information between users

### Firestore Rules

```javascript
match /clients/{clientId} {
  allow read, write: if request.auth != null && request.auth.uid == clientId;
}
```

## Performance Considerations

### Optimization Strategies

- **Lazy Loading**: Profile data loaded only when needed
- **Debouncing**: Form input updates optimized
- **Caching**: Profile data cached locally when possible
- **Minimal Re-renders**: Efficient state management

### Monitoring

- **Load Times**: Profile tab load performance
- **Update Latency**: Real-time update responsiveness
- **Error Rates**: Profile operation success rates
- **User Engagement**: Profile tab usage patterns

## Conclusion

The default address feature significantly improves the user experience for delivery orders while maintaining flexibility for clients who need to use different addresses. The implementation follows best practices for real-time data management, user interface design, and error handling.

The feature is designed to be scalable and can easily accommodate future enhancements such as multiple addresses, address validation, and advanced location services.
