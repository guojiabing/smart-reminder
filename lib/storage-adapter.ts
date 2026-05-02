/**
 * Storage Adapter - A mock database layer using localStorage.
 * Provides a clean API for persisting state across page reloads.
 */

export const storageAdapter = {
  /**
   * Get an item from storage with automatic JSON parsing
   */
  getItem: <T>(key: string, defaultValue: T): T => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const saved = localStorage.getItem(`smart_reminder_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.error(`Error reading from storage key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Set an item to storage with automatic JSON stringification
   */
  setItem: <T>(key: string, value: T): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`smart_reminder_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to storage key "${key}":`, error);
    }
  },

  /**
   * Remove an item from storage
   */
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(`smart_reminder_${key}`);
  },

  /**
   * Clear all app-related storage
   */
  clearAll: (): void => {
    if (typeof window === "undefined") return;
    Object.keys(localStorage)
      .filter((key) => key.startsWith("smart_reminder_"))
      .forEach((key) => localStorage.removeItem(key));
  },
};
