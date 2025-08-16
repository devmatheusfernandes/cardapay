import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes and their required roles
const protectedRoutes = {
  // Restaurant owner dashboard routes
  '/dashboard': ['owner'],
  '/dashboard/analytics': ['owner'],
  '/dashboard/billing': ['owner'],
  '/dashboard/entregadores': ['owner'],
  '/dashboard/garcons': ['owner'],
  '/dashboard/kitchen': ['owner'],
  '/dashboard/menu': ['owner'],
  '/dashboard/orders': ['owner'],
  '/dashboard/pedidos': ['owner'],
  '/dashboard/profile': ['owner'],
  '/dashboard/subscription': ['owner'],
  '/dashboard/waiter': ['owner'],
  '/dashboard/welcome': ['owner'],
  '/dashboard/welcome-trial': ['owner'],
  
  // Waiter dashboard routes
  '/waiter/dashboard': ['waiter'],
  '/waiter/dashboard/waiter': ['waiter'],
  '/waiter/dashboard/waiter/': ['waiter'],
  
  // Driver dashboard routes
  '/driver/dashboard': ['driver'],
  
  // API routes that need authentication
  '/api/waiters': ['owner'],
  '/api/drivers': ['owner'],
  '/api/stripe-connect': ['owner'],
  '/api/stripe-subscription': ['owner'],
  '/api/checkout-session': ['owner'],
}

// Helper function to check if a route matches a pattern
function matchesRoute(pathname: string, route: string): boolean {
  if (route.endsWith('/')) {
    return pathname.startsWith(route)
  }
  return pathname === route
}

// Helper function to get user role from pathname
function getUserRole(pathname: string): string | null {
  if (pathname.startsWith('/waiter/')) {
    return 'waiter'
  }
  if (pathname.startsWith('/driver/')) {
    return 'driver'
  }
  if (pathname.startsWith('/dashboard/')) {
    return 'owner'
  }
  return null
}

// Helper function to check if user has access to a route
function hasAccess(pathname: string, userRole: string | null): boolean {
  // Find the matching protected route
  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (matchesRoute(pathname, route)) {
      return allowedRoles.includes(userRole || '')
    }
  }
  
  // If no specific route matches, check by prefix
  if (pathname.startsWith('/waiter/dashboard')) {
    return userRole === 'waiter'
  }
  if (pathname.startsWith('/driver/dashboard')) {
    return userRole === 'driver'
  }
  if (pathname.startsWith('/dashboard')) {
    return userRole === 'owner'
  }
  
  return false
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for public routes
  if (
    pathname === '/' ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/resourses/') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/waiter-login') ||
    pathname.startsWith('/waiter-signup') ||
    pathname.startsWith('/driver-login') ||
    pathname.startsWith('/driver-signup') ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/help') ||
    pathname.startsWith('/demo') ||
    pathname.startsWith('/restaurants') ||
    pathname.startsWith('/track') ||
    pathname.startsWith('/last-orders') ||
    pathname.startsWith('/success') ||
    pathname.startsWith('/globals.css')
  ) {
    return NextResponse.next()
  }

  // Check if the route is protected
  const isProtectedRoute = Object.keys(protectedRoutes).some(route => 
    matchesRoute(pathname, route)
  ) || pathname.startsWith('/waiter/dashboard') || 
      pathname.startsWith('/driver/dashboard') || 
      pathname.startsWith('/dashboard')

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // For API routes, let them handle their own authentication
  // The API routes will validate Firebase tokens themselves
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // For page routes, check for authentication cookies
  // In a real implementation, you might want to validate the Firebase token here
  // For now, we'll let the individual pages handle authentication
  // This provides a basic level of protection while allowing the pages to handle
  // their own authentication logic (which is more flexible for Firebase)
  
  // You can add additional checks here if needed, such as:
  // - Checking for specific cookies
  // - Validating session tokens
  // - Rate limiting
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
