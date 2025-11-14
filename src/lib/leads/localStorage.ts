// Local storage helper utilities for storing data locally
// This will be used until the app is integrated with the main app

const STORAGE_KEYS = {
  LEADS: 'list-app-leads',
  ROUTES: 'list-app-routes',
  IMPORT_SESSIONS: 'list-app-import-sessions',
  SAVED_SEARCHES: 'list-app-saved-searches',
  NOTES: 'list-app-notes',
  INTERACTIONS: 'list-app-interactions',
} as const;

// Generic storage functions
export const storage = {
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    
    try {
      // Only clear our app's keys
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Generate unique IDs with counter to prevent duplicates in rapid succession
let idCounter = 0;
export const generateId = (): string => {
  idCounter = (idCounter + 1) % 10000; // Reset after 10000 to keep it manageable
  return `${Date.now()}-${idCounter}-${Math.random().toString(36).substr(2, 9)}`;
};

export { STORAGE_KEYS };
