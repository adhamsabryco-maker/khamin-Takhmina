// Polyfill for localStorage and sessionStorage in iframe with restricted permissions
try {
  const testKey = '__storage_test__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
} catch (e) {
  console.warn('Storage access denied (likely iframe restrictions), falling back to in-memory storage');
  
  const createMemoryStorage = () => {
    let map = new Map<string, string>();
    return {
      getItem: (key: string) => map.has(key) ? map.get(key)! : null,
      setItem: (key: string, value: string) => map.set(key, String(value)),
      removeItem: (key: string) => map.delete(key),
      clear: () => map.clear(),
      key: (index: number) => Array.from(map.keys())[index] || null,
      get length() { return map.size; }
    };
  };

  const memLocal = createMemoryStorage();
  const memSession = createMemoryStorage();
  
  Object.defineProperty(window, 'localStorage', { value: memLocal, configurable: true, enumerable: true, writable: true });
  Object.defineProperty(window, 'sessionStorage', { value: memSession, configurable: true, enumerable: true, writable: true });
}

// Polyfill alert handling for sandboxed iframes
const originalAlert = window.alert;
window.alert = function(msg) {
  try {
    originalAlert(msg);
  } catch (e) {
    console.warn("Alert blocked by iframe sandbox:", msg);
  }
};
