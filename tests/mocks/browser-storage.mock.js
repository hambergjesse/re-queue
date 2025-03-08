/**
 * Simple mock implementation for browser storage
 * This replaces the need for the mock-browser-storage package
 */

class StorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
    return Promise.resolve();
  }

  getItem(key) {
    return Promise.resolve(this.store[key] || null);
  }

  setItem(key, value) {
    this.store[key] = value;
    return Promise.resolve();
  }

  removeItem(key) {
    delete this.store[key];
    return Promise.resolve();
  }
}

// Create mock implementations for localStorage and sessionStorage
const mockLocalStorage = new StorageMock();
const mockSessionStorage = new StorageMock();

// Create mock implementation for chrome.storage.local
const mockChromeStorage = {
  local: {
    get: (key, callback) => {
      if (typeof key === 'string') {
        const result = {};
        result[key] = mockLocalStorage.store[key] || null;
        callback(result);
      } else if (Array.isArray(key)) {
        const result = {};
        key.forEach(k => {
          result[k] = mockLocalStorage.store[k] || null;
        });
        callback(result);
      } else if (typeof key === 'object') {
        const result = {};
        Object.keys(key).forEach(k => {
          result[k] = mockLocalStorage.store[k] || key[k];
        });
        callback(result);
      } else {
        callback(mockLocalStorage.store);
      }
    },
    set: (items, callback) => {
      Object.keys(items).forEach(key => {
        mockLocalStorage.store[key] = items[key];
      });
      if (callback) callback();
    },
    remove: (keys, callback) => {
      if (typeof keys === 'string') {
        delete mockLocalStorage.store[keys];
      } else if (Array.isArray(keys)) {
        keys.forEach(key => {
          delete mockLocalStorage.store[key];
        });
      }
      if (callback) callback();
    },
    clear: (callback) => {
      mockLocalStorage.store = {};
      if (callback) callback();
    }
  }
};

module.exports = {
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
  chromeStorage: mockChromeStorage
}; 