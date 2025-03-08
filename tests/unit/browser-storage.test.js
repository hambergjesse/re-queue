// tests/unit/browser-storage.test.js
// Tests for our custom browser storage mock

const { localStorage, sessionStorage, chromeStorage } = require('../mocks/browser-storage.mock');

describe('Browser Storage Mock', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();
    chromeStorage.local.clear();
  });

  describe('localStorage mock', () => {
    it('should set and get items', async () => {
      await localStorage.setItem('testKey', 'testValue');
      const value = await localStorage.getItem('testKey');
      expect(value).toBe('testValue');
    });

    it('should return null for non-existent keys', async () => {
      const value = await localStorage.getItem('nonExistentKey');
      expect(value).toBeNull();
    });

    it('should remove items', async () => {
      await localStorage.setItem('testKey', 'testValue');
      await localStorage.removeItem('testKey');
      const value = await localStorage.getItem('testKey');
      expect(value).toBeNull();
    });

    it('should clear all items', async () => {
      await localStorage.setItem('key1', 'value1');
      await localStorage.setItem('key2', 'value2');
      await localStorage.clear();
      
      const value1 = await localStorage.getItem('key1');
      const value2 = await localStorage.getItem('key2');
      
      expect(value1).toBeNull();
      expect(value2).toBeNull();
    });
  });

  describe('chrome.storage mock', () => {
    it('should set and get items', (done) => {
      chromeStorage.local.set({ testKey: 'testValue' }, () => {
        chromeStorage.local.get('testKey', (result) => {
          expect(result.testKey).toBe('testValue');
          done();
        });
      });
    });

    it('should return null for non-existent keys', (done) => {
      chromeStorage.local.get('nonExistentKey', (result) => {
        expect(result.nonExistentKey).toBeNull();
        done();
      });
    });

    it('should remove items', (done) => {
      chromeStorage.local.set({ testKey: 'testValue' }, () => {
        chromeStorage.local.remove('testKey', () => {
          chromeStorage.local.get('testKey', (result) => {
            expect(result.testKey).toBeNull();
            done();
          });
        });
      });
    });

    it('should handle getting multiple keys', (done) => {
      chromeStorage.local.set({ key1: 'value1', key2: 'value2' }, () => {
        chromeStorage.local.get(['key1', 'key2'], (result) => {
          expect(result.key1).toBe('value1');
          expect(result.key2).toBe('value2');
          done();
        });
      });
    });

    it('should handle getting keys with defaults', (done) => {
      chromeStorage.local.get({ key1: 'default1', key2: 'default2' }, (result) => {
        expect(result.key1).toBe('default1');
        expect(result.key2).toBe('default2');
        done();
      });
    });
  });
}); 