import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '@/lib/types';

const DEFAULT_ADMIN: User = {
  id: 'admin-1',
  username: 'Camryn',
  password: 'Elliot6242!',
  role: 'admin',
  name: 'Camryn Admin',
  email: 'camryn@company.com',
  isActive: true,
  requiresPasswordChange: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

const SAMPLE_USERS: User[] = [
  {
    id: 'user-1',
    username: 'john',
    password: 'password123',
    role: 'manager',
    name: 'John Manager',
    email: 'john@company.com',
    isActive: true,
    requiresPasswordChange: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'user-2',
    username: 'jane',
    password: 'password123',
    role: 'user',
    name: 'Jane User',
    email: 'jane@company.com',
    isActive: true,
    requiresPasswordChange: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Global storage key for cross-browser user synchronization
const GLOBAL_USERS_KEY = 'smart-cost-calculator-global-users';

// Enhanced validation function for user data
const validateUserData = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  
  // Check if users array exists and is valid
  if (!data.users || !Array.isArray(data.users)) return false;
  
  // Validate each user object
  for (const user of data.users) {
    if (!user || typeof user !== 'object') return false;
    
    // Check required user properties
    const requiredProps = ['id', 'username', 'password', 'role', 'name', 'email', 'isActive'];
    for (const prop of requiredProps) {
      if (!user.hasOwnProperty(prop)) return false;
    }
    
    // Validate role
    if (!['admin', 'manager', 'user'].includes(user.role)) return false;
    
    // Validate email format (basic check)
    if (typeof user.email !== 'string' || !user.email.includes('@')) return false;
  }
  
  return true;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      users: [DEFAULT_ADMIN, ...SAMPLE_USERS],

      login: async (username: string, password: string) => {
        const { users } = get();
        const user = users.find(u => u.username === username && u.password === password && u.isActive);
        
        if (user) {
          set({ isAuthenticated: true, user });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ isAuthenticated: false, user: null });
      },

      checkAuth: () => {
        const { isAuthenticated } = get();
        return isAuthenticated;
      },

      addUser: (user: User) => {
        set((state) => ({
          users: [...state.users, user]
        }));
        // Sync to global storage immediately
        get().syncUsersToGlobalStorage();
      },

      updateUser: (id: string, updates: Partial<User>) => {
        set((state) => ({
          users: state.users.map(user => 
            user.id === id ? { ...user, ...updates } : user
          )
        }));
        // Sync to global storage immediately
        get().syncUsersToGlobalStorage();
      },

      deleteUser: (id: string) => {
        set((state) => ({
          users: state.users.filter(user => user.id !== id)
        }));
        // Sync to global storage immediately
        get().syncUsersToGlobalStorage();
      },

      changePassword: (userId: string, newPassword: string) => {
        set((state) => ({
          users: state.users.map(user => 
            user.id === userId 
              ? { ...user, password: newPassword, requiresPasswordChange: false, updatedAt: new Date() }
              : user
          ),
          user: state.user?.id === userId 
            ? { ...state.user, password: newPassword, requiresPasswordChange: false, updatedAt: new Date() }
            : state.user
        }));
        // Sync to global storage immediately
        get().syncUsersToGlobalStorage();
      },

      resetPassword: (userId: string, newPassword: string) => {
        set((state) => ({
          users: state.users.map(user => 
            user.id === userId 
              ? { ...user, password: newPassword, requiresPasswordChange: true, updatedAt: new Date() }
              : user
          )
        }));
        // Sync to global storage immediately
        get().syncUsersToGlobalStorage();
      },

      syncUsersToGlobalStorage: () => {
        if (typeof window !== 'undefined') {
          try {
            const state = get();
            const globalData = {
              users: state.users,
              lastUpdated: new Date().toISOString(),
              version: '1.0'
            };
            
            // Validate data before saving
            if (validateUserData(globalData)) {
              localStorage.setItem(GLOBAL_USERS_KEY, JSON.stringify(globalData));
              console.log('Users synced to global storage successfully');
            } else {
              console.error('Invalid user data, not syncing to global storage');
            }
          } catch (error) {
            console.error('Error syncing users to global storage:', error);
          }
        }
      },

      loadUsersFromGlobalStorage: () => {
        if (typeof window !== 'undefined') {
          try {
            const globalData = localStorage.getItem(GLOBAL_USERS_KEY);
            if (globalData) {
              const parsed = JSON.parse(globalData);
              
              // Validate the loaded data
              if (validateUserData(parsed)) {
                set({ users: parsed.users });
                console.log('Users loaded from global storage successfully');
                return true;
              } else {
                console.warn('Invalid user data in global storage, using defaults');
                return false;
              }
            }
          } catch (error) {
            console.error('Error loading users from global storage:', error);
          }
        }
        return false;
      },

      initializeUsers: () => {
        // First, try to load from global storage
        const globalLoaded = get().loadUsersFromGlobalStorage();
        if (!globalLoaded) {
          // If no global data, sync current users to global storage
          get().syncUsersToGlobalStorage();
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        users: state.users
      }),
    }
  )
); 