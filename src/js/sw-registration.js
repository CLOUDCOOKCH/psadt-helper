(() => {
  const SW_PATH = 'sw.js';
  const PREF_KEY = 'psadt-cache-disabled';
  const CACHE_PREFIX = 'psadt-cache-';

  const hasServiceWorkerSupport = () =>
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

  const logError = (error) => {
    if (typeof console !== 'undefined' && console.error) {
      console.error('[psadt-helper] Service worker error:', error);
    }
  };

  async function register() {
    if (!hasServiceWorkerSupport()) return null;
    try {
      return await navigator.serviceWorker.register(SW_PATH);
    } catch (error) {
      logError(error);
      return null;
    }
  }

  async function clearCaches() {
    if (typeof caches === 'undefined') return;
    try {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX))
          .map((key) => caches.delete(key)),
      );
    } catch (error) {
      logError(error);
    }
  }

  async function unregister() {
    if (!hasServiceWorkerSupport()) return;
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch (error) {
      logError(error);
    }
    await clearCaches();
  }

  const shouldEnable = () => {
    try {
      return localStorage.getItem(PREF_KEY) !== 'true';
    } catch (error) {
      logError(error);
      return true;
    }
  };

  const setPreference = async (enabled) => {
    try {
      localStorage.setItem(PREF_KEY, enabled ? 'false' : 'true');
    } catch (error) {
      logError(error);
    }
    if (enabled) {
      await register();
    } else {
      await unregister();
    }
  };

  const init = async () => {
    if (!shouldEnable()) {
      await unregister();
      return;
    }
    await register();
  };

  if (typeof window !== 'undefined') {
    window.psadtServiceWorker = {
      SW_PATH,
      PREF_KEY,
      register,
      unregister,
      shouldEnable,
      setPreference,
      init,
    };
    init();
  }

  if (typeof module !== 'undefined') {
    module.exports = {
      SW_PATH,
      PREF_KEY,
      register,
      unregister,
      shouldEnable,
      setPreference,
      init,
    };
  }
})();
