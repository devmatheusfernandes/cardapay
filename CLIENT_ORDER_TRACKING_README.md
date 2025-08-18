# Client Order Tracking System

This document explains how the order tracking system works for logged-in clients in the CardaPay application.

## Overview

The client order tracking system allows logged-in users to:

- Track all their orders across different restaurants
- View order history with detailed information
- Monitor order status in real-time
- Access order details and confirmation codes
- Navigate directly to order tracking pages

## How It Works

### 1. Order Creation with Client ID

When a logged-in client makes an order:

1. **Authentication Check**: The checkout process checks if the user is authenticated
2. **ID Token**: If authenticated, the client's ID token is included in the checkout request
3. **Metadata Storage**: The client's user ID is stored in the Stripe session metadata
4. **Order Creation**: When payment is successful, the webhook creates an order with the `clientId` field

#### Code Flow:

```typescript
// 1. CartSidebar sends authorization header with ID token
const headers: Record<string, string> = { "Content-Type": "application/json" };
if (user) {
  const idToken = await user.getIdToken();
  headers["Authorization"] = `Bearer ${idToken}`;
}

// 2. Checkout API extracts client ID from token
const clientId = await getClientId(req);
if (clientId) {
  metadata.clientId = clientId;
}

// 3. Webhook creates order with client ID
if (metadata.clientId) {
  orderData.clientId = metadata.clientId;
}
```

### 2. Order Storage

Orders are stored in the Firestore `orders` collection with the following structure:

```typescript
interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: Timestamp;
  restaurantId: string;
  clientId?: string; // ← This field links the order to the client
  isDelivery: boolean;
  deliveryAddress?: string;
  confirmationCode?: string;
  // ... other fields
}
```

### 3. Client Order Retrieval

The `useClientOrders` hook fetches orders for the authenticated client:

```typescript
// Query orders where the client is the buyer
const q = query(collection(db, "orders"), where("clientId", "==", user.uid));
```

## Implementation Details

### Files Modified/Created

1. **`lib/types/track/order.ts`**

   - Added `clientId?: string` field to Order interface

2. **`lib/hooks/useClientOrders.ts`** (NEW)

   - Hook to fetch orders for authenticated clients
   - Real-time updates using Firestore onSnapshot
   - Proper timestamp handling and error management

3. **`app/api/checkout-session/route.ts`**

   - Added authentication check using Firebase Admin
   - Extracts client ID from ID token
   - Includes client ID in Stripe metadata

4. **`app/api/stripe-webhook/route.ts`**

   - Creates orders with client ID when available
   - Maintains backward compatibility for anonymous orders

5. **`app/components/restaurantSlug/CartSidebar.tsx`**

   - Sends authorization header when user is logged in
   - Gracefully handles authentication errors

6. **`app/client/dashboard/page.tsx`**

   - Added orders tab to client dashboard
   - Displays order history with status tracking
   - Links to individual order tracking pages

7. **`app/components/landing/Header.tsx`**
   - Updated navigation to include client authentication options
   - Dropdown menu for client login/signup

### Database Schema

```typescript
// Orders Collection
orders: {
  [orderId]: {
    // ... existing fields
    clientId: "user_uid_here", // ← NEW: Links to client
    // ... other fields
  }
}

// Clients Collection (existing)
clients: {
  [clientId]: {
    name: string;
    email: string;
    createdAt: Timestamp;
    role: "client";
  }
}
```

## User Experience

### For Logged-in Clients

1. **Order Placement**: Seamless checkout with automatic order tracking
2. **Dashboard Access**: View all orders in the client dashboard
3. **Real-time Updates**: Order status updates in real-time
4. **Order Details**: Access to order items, status, and confirmation codes
5. **Tracking Links**: Direct links to order tracking pages

### For Anonymous Users

1. **Order Placement**: Can still place orders normally
2. **Manual Tracking**: Must use order ID to track orders
3. **No History**: No centralized order history

## Security Features

### Authentication

- Firebase ID token verification on checkout
- Server-side authentication using Firebase Admin
- Protected client dashboard routes

### Data Isolation

- Clients can only see their own orders
- Role-based access control via RoleGuard
- Secure order queries using `clientId` filter

### Privacy

- Client ID only stored when explicitly authenticated
- Anonymous orders remain anonymous
- No cross-user data access

## Usage Examples

### Making an Order as a Logged-in Client

1. **Login**: User logs in via `/client-login`
2. **Browse**: User visits restaurant and adds items to cart
3. **Checkout**: CartSidebar automatically includes authorization header
4. **Payment**: Stripe processes payment with client ID in metadata
5. **Order Creation**: Webhook creates order with `clientId` field
6. **Tracking**: Order appears in client dashboard automatically

### Viewing Order History

1. **Dashboard**: Navigate to `/client/dashboard`
2. **Orders Tab**: Click on "Meus Pedidos" tab
3. **Order List**: View all orders with status and details
4. **Order Details**: Click on individual orders for more information
5. **Tracking**: Use "Acompanhar Pedido" link for detailed tracking

## Benefits

### For Clients

- **Centralized Tracking**: All orders in one place
- **Real-time Updates**: Live status information
- **Easy Access**: No need to remember order IDs
- **Order History**: Complete record of all purchases

### For Restaurants

- **Customer Insights**: Better understanding of repeat customers
- **Order Management**: Easier to handle customer inquiries
- **Customer Service**: Improved support capabilities

### For Platform

- **User Engagement**: Increased client retention
- **Data Analytics**: Better understanding of user behavior
- **Feature Development**: Foundation for future enhancements

## Future Enhancements

### Planned Features

1. **Order Notifications**: Push notifications for status updates
2. **Order Reviews**: Rate and review completed orders
3. **Reorder Functionality**: Quick reorder from order history
4. **Loyalty Program**: Points and rewards system
5. **Order Preferences**: Save delivery addresses and preferences

### Technical Improvements

1. **Offline Support**: Cache orders for offline viewing
2. **Push Notifications**: Real-time status updates
3. **Order Analytics**: Personal order statistics
4. **Integration**: Connect with external delivery services

## Troubleshooting

### Common Issues

1. **Orders Not Appearing**

   - Check if user is properly authenticated
   - Verify `clientId` field in order document
   - Check Firestore security rules

2. **Authentication Errors**

   - Ensure ID token is valid and not expired
   - Check Firebase configuration
   - Verify user role is "client"

3. **Real-time Updates Not Working**
   - Check Firestore connection
   - Verify onSnapshot listener is active
   - Check for JavaScript errors in console

### Debug Steps

1. **Check Order Document**: Verify `clientId` field exists
2. **Verify Authentication**: Check user state and role
3. **Check Network**: Monitor API calls and responses
4. **Review Logs**: Check browser console and server logs

## Conclusion

The client order tracking system provides a seamless experience for logged-in users while maintaining security and privacy. It creates a foundation for enhanced customer engagement and provides valuable insights for both clients and restaurants.

The system is designed to be:

- **Secure**: Proper authentication and data isolation
- **Scalable**: Efficient database queries and real-time updates
- **User-friendly**: Intuitive interface and seamless integration
- **Extensible**: Foundation for future features and enhancements
