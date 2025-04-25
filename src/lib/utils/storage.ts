// src/lib/utils/storage.ts
/**
 * Browser storage utility functions
 */

// Session storage helpers
export const sessionStorage = {
    get: (key: string): any => {
      if (typeof window === 'undefined') return null;
      
      try {
        const item = window.sessionStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.error('Error getting session storage item:', error);
        return null;
      }
    },
    
    set: (key: string, value: any): void => {
      if (typeof window === 'undefined') return;
      
      try {
        window.sessionStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('Error setting session storage item:', error);
      }
    },
    
    remove: (key: string): void => {
      if (typeof window === 'undefined') return;
      
      try {
        window.sessionStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing session storage item:', error);
      }
    },
    
    clear: (): void => {
      if (typeof window === 'undefined') return;
      
      try {
        window.sessionStorage.clear();
      } catch (error) {
        console.error('Error clearing session storage:', error);
      }
    }
  };
  
  // Local storage helpers
  export const localStorage = {
    get: (key: string): any => {
      if (typeof window === 'undefined') return null;
      
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.error('Error getting local storage item:', error);
        return null;
      }
    },
    
    set: (key: string, value: any): void => {
      if (typeof window === 'undefined') return;
      
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('Error setting local storage item:', error);
      }
    },
    
    remove: (key: string): void => {
      if (typeof window === 'undefined') return;
      
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing local storage item:', error);
      }
    },
    
    clear: (): void => {
      if (typeof window === 'undefined') return;
      
      try {
        window.localStorage.clear();
      } catch (error) {
        console.error('Error clearing local storage:', error);
      }
    }
  };