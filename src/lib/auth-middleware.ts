import { NextRequest, NextResponse } from 'next/server';

/**
 * User information extracted from the request
 */
export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'manager' | 'user';
  name: string;
  email: string;
}

/**
 * Result of authentication check
 */
export interface AuthResult {
  authenticated: boolean;
  authorized: boolean;
  user: AuthUser | null;
  error?: string;
}

/**
 * Extract user information from request headers
 * The client should send user information in the X-User-Data header as a JSON string
 * 
 * @param request - The Next.js request object
 * @returns AuthUser object or null if not found
 */
function getUserFromRequest(request: NextRequest): AuthUser | null {
  try {
    // Try to get user data from header
    const userDataHeader = request.headers.get('x-user-data');
    
    if (!userDataHeader) {
      return null;
    }

    // Parse the user data
    const userData = JSON.parse(userDataHeader);
    
    // Validate required fields
    if (!userData.id || !userData.username || !userData.role || !userData.name || !userData.email) {
      console.error('Invalid user data in header: missing required fields');
      return null;
    }

    // Validate role
    if (!['admin', 'manager', 'user'].includes(userData.role)) {
      console.error('Invalid user role:', userData.role);
      return null;
    }

    return {
      id: userData.id,
      username: userData.username,
      role: userData.role,
      name: userData.name,
      email: userData.email
    };
  } catch (error) {
    console.error('Error extracting user from request:', error);
    return null;
  }
}

/**
 * Check if user has required role for scraper access (admin or manager)
 * 
 * @param user - The authenticated user
 * @returns true if user has admin or manager role
 */
function hasScraperAccess(user: AuthUser): boolean {
  return user.role === 'admin' || user.role === 'manager';
}

/**
 * Authentication and authorization middleware for scraper API routes
 * Checks if the user is authenticated and has the required role (admin or manager)
 * 
 * @param request - The Next.js request object
 * @returns AuthResult object with authentication and authorization status
 */
export function checkScraperAuth(request: NextRequest): AuthResult {
  // Extract user from request
  const user = getUserFromRequest(request);

  // Check if user is authenticated
  if (!user) {
    return {
      authenticated: false,
      authorized: false,
      user: null,
      error: 'Unauthorized: No valid authentication credentials provided'
    };
  }

  // Check if user has required role
  if (!hasScraperAccess(user)) {
    return {
      authenticated: true,
      authorized: false,
      user,
      error: 'Forbidden: Insufficient permissions. Admin or Manager role required.'
    };
  }

  // User is authenticated and authorized
  return {
    authenticated: true,
    authorized: true,
    user
  };
}

/**
 * Middleware wrapper that returns appropriate HTTP responses for auth failures
 * Use this in API routes to protect endpoints
 * 
 * @param request - The Next.js request object
 * @returns NextResponse with error if auth fails, null if auth succeeds
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const authError = requireScraperAuth(request);
 *   if (authError) return authError;
 *   
 *   // User is authenticated and authorized, proceed with request
 *   // ...
 * }
 * ```
 */
export function requireScraperAuth(request: NextRequest): NextResponse | null {
  const authResult = checkScraperAuth(request);

  if (!authResult.authenticated) {
    return NextResponse.json(
      { error: authResult.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error || 'Forbidden' },
      { status: 403 }
    );
  }

  // Auth successful, return null to indicate no error
  return null;
}

/**
 * Get the authenticated user from the request
 * Should only be called after requireScraperAuth has verified authentication
 * 
 * @param request - The Next.js request object
 * @returns AuthUser object or null
 */
export function getAuthenticatedUser(request: NextRequest): AuthUser | null {
  return getUserFromRequest(request);
}
