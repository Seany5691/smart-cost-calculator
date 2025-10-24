/**
 * API Client Helper for Scraper Components
 * 
 * Provides authenticated fetch wrapper that automatically includes
 * user authentication headers required by the auth middleware.
 */

import { useAuthStore } from '@/store/auth';

/**
 * Get authentication headers for API requests
 * Includes user data in x-user-data header as expected by auth middleware
 */
export function getAuthHeaders(): HeadersInit {
  const user = useAuthStore.getState().user;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (user) {
    headers['x-user-data'] = JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email
    });
  }
  
  return headers;
}

/**
 * Authenticated fetch wrapper for scraper API calls
 * Automatically includes authentication headers
 * 
 * @param url - API endpoint URL
 * @param options - Fetch options (method, body, etc.)
 * @returns Promise<Response>
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = getAuthHeaders();
  
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  };
  
  return fetch(url, mergedOptions);
}
