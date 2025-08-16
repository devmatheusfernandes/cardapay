# Authentication & Middleware System

This document describes the authentication and middleware system implemented in the CardaPay application.

## Overview

The application implements a multi-layered authentication system that protects different dashboard routes based on user roles (owner, waiter, driver). The system consists of:

1. **Middleware** - Basic route protection at the server level
2. **Role Guards** - Client-side authentication and role verification
3. **API Route Protection** - Server-side token validation

## Architecture

### User Roles

- **Owner** (`/dashboard/*`) - Restaurant owners with full access to all features
- **Waiter** (`/waiter/dashboard/*`) - Waiters with access to table management
- **Driver** (`/driver/dashboard/*`) - Delivery drivers with access to delivery management

### Collections Structure

- `users` - Restaurant owners
- `waiters` - Waiters (can be associated with restaurants)
- `drivers` - Drivers (can be associated with restaurants)

## Middleware (`middleware.ts`)

The middleware provides basic route protection by:

- Identifying protected routes based on path patterns
- Allowing public routes to pass through
- Letting API routes handle their own authentication
- Providing a foundation for future enhancements

### Protected Routes

```typescript
const protectedRoutes = {
  // Restaurant owner dashboard routes
  "/dashboard": ["owner"],
  "/dashboard/analytics": ["owner"],
  "/dashboard/billing": ["owner"],
  // ... more routes

  // Waiter dashboard routes
  "/waiter/dashboard": ["waiter"],
  "/waiter/dashboard/waiter": ["waiter"],

  // Driver dashboard routes
  "/driver/dashboard": ["driver"],
};
```

### Public Routes

The following routes are considered public and bypass middleware:

- `/` - Landing page
- `/sign-in`, `/sign-up` - Authentication pages
- `/waiter-login`, `/waiter-signup` - Waiter authentication
- `/driver-login`, `/driver-signup` - Driver authentication
- `/pricing`, `/help`, `/demo` - Public information pages
- `/restaurants/*` - Public restaurant pages
- `/track/*` - Order tracking
- Static assets and API routes

## Role Guards

### RoleGuard Component

The `RoleGuard` component provides client-side authentication and role verification:

```typescript
<RoleGuard allowedRoles={["owner"]}>
  <DashboardContent />
</RoleGuard>
```

**Features:**

- Automatically redirects unauthenticated users to appropriate login pages
- Verifies user roles against allowed roles
- Redirects users to appropriate dashboards if they don't have access
- Shows loading states during authentication checks

**Props:**

- `allowedRoles`: Array of roles that can access the content
- `fallback`: Optional custom loading component
- `redirectTo`: Optional custom redirect path

### AuthGuard Component

The `AuthGuard` component provides more comprehensive authentication:

```typescript
<AuthGuard requiredRole="waiter">
  <WaiterDashboard />
</AuthGuard>
```

**Features:**

- Similar to RoleGuard but with single role requirement
- More specific role checking
- Better for single-role protected areas

## Implementation in Layouts

### Restaurant Owner Dashboard

```typescript
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <RoleGuard allowedRoles={["owner"]}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </RoleGuard>
  );
}
```

### Waiter Dashboard

```typescript
// app/waiter/dashboard/layout.tsx
export default function WaiterDashboardLayout({
  children,
}: DashboardLayoutProps) {
  return <RoleGuard allowedRoles={["waiter"]}>{children}</RoleGuard>;
}
```

### Driver Dashboard

```typescript
// app/driver/dashboard/layout.tsx
export default function DriverDashboardLayout({
  children,
}: DashboardLayoutProps) {
  return <RoleGuard allowedRoles={["driver"]}>{children}</RoleGuard>;
}
```

## API Route Protection

API routes are protected by validating Firebase ID tokens in the request headers:

```typescript
// Example API route protection
async function getUserId(req: NextRequest) {
  const authorization = req.headers.get("Authorization");
  if (authorization?.startsWith("Bearer ")) {
    const idToken = authorization.split("Bearer ")[1];
    try {
      const decodedToken = await auth().verifyIdToken(idToken);
      return decodedToken.uid;
    } catch (error) {
      return null;
    }
  }
  return null;
}
```

## Security Features

### Route Protection

- All dashboard routes are protected by role-based access control
- Users are automatically redirected to appropriate login pages
- Role verification happens at both client and server levels

### Authentication Flow

1. User attempts to access protected route
2. Middleware identifies the route as protected
3. RoleGuard checks user authentication and role
4. If unauthorized, user is redirected to appropriate login page
5. If authorized, content is rendered

### Token Validation

- Firebase ID tokens are validated on every API request
- Tokens are verified server-side for security
- Expired or invalid tokens result in 401 responses

## Usage Examples

### Protecting a Single Page

```typescript
// app/dashboard/sensitive-page/page.tsx
export default function SensitivePage() {
  return (
    <RoleGuard allowedRoles={["owner"]}>
      <div>
        <h1>Sensitive Content</h1>
        <p>Only restaurant owners can see this.</p>
      </div>
    </RoleGuard>
  );
}
```

### Protecting Multiple Roles

```typescript
// app/shared/admin-page/page.tsx
export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={["owner", "waiter"]}>
      <div>
        <h1>Admin Content</h1>
        <p>Owners and waiters can see this.</p>
      </div>
    </RoleGuard>
  );
}
```

### Custom Redirects

```typescript
<RoleGuard
  allowedRoles={["owner"]}
  redirectTo="/unauthorized"
  fallback={<CustomLoading />}
>
  <ProtectedContent />
</RoleGuard>
```

## Future Enhancements

### Planned Features

- Rate limiting for API routes
- Session management and timeout handling
- Audit logging for authentication events
- Two-factor authentication support
- Role-based permissions within dashboards

### Potential Improvements

- Server-side middleware with Firebase token validation
- Caching of user roles to reduce database queries
- Integration with Firebase Auth custom claims
- Advanced permission system for granular access control

## Troubleshooting

### Common Issues

1. **Infinite Redirects**: Check if login pages are properly excluded from middleware
2. **Role Mismatches**: Verify user exists in correct collection
3. **Authentication Failures**: Check Firebase configuration and token validity
4. **Performance Issues**: Consider implementing role caching

### Debug Mode

Enable debug logging by setting environment variables:

```bash
NEXT_PUBLIC_AUTH_DEBUG=true
```

## Best Practices

1. **Always use RoleGuard** for protected content
2. **Implement proper error boundaries** around authentication components
3. **Use appropriate loading states** during authentication checks
4. **Validate permissions** at both client and server levels
5. **Handle edge cases** like network failures and token expiration
6. **Test authentication flows** thoroughly in different scenarios

## Security Considerations

- Never expose sensitive information in client-side code
- Always validate tokens server-side for API routes
- Implement proper session timeout handling
- Use HTTPS in production environments
- Regularly audit authentication logs
- Implement rate limiting for authentication endpoints
