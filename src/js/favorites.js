(function (global) {
  const STORAGE_KEY = 'psadt-favorites';

  function parseStoredFavorites(raw) {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (err) {
      return [];
    }
  }

  function createFavoriteStore(storage = global.localStorage) {
    const favorites = new Set();

    if (storage && typeof storage.getItem === 'function') {
      try {
        parseStoredFavorites(storage.getItem(STORAGE_KEY)).forEach((id) =>
          favorites.add(id),
        );
      } catch (err) {
        // Ignore storage errors
      }
    }

    function persist() {
      if (!storage || typeof storage.setItem !== 'function') return;
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favorites)));
      } catch (err) {
        // Ignore storage errors
      }
    }

    function isFavorite(id) {
      return favorites.has(id);
    }

    function add(id) {
      if (!id) return false;
      const sizeBefore = favorites.size;
      favorites.add(id);
      if (favorites.size !== sizeBefore) {
        persist();
        return true;
      }
      return false;
    }

    function remove(id) {
      if (!id || !favorites.has(id)) return false;
      favorites.delete(id);
      persist();
      return true;
    }

    function toggle(id) {
      if (!id) return false;
      if (favorites.has(id)) {
        favorites.delete(id);
        persist();
        return false;
      }
      favorites.add(id);
      persist();
      return true;
    }

    function getAll() {
      return Array.from(favorites);
    }

    return {
      isFavorite,
      add,
      remove,
      toggle,
      getAll,
    };
  }

  if (typeof module !== 'undefined') {
    module.exports = {
      STORAGE_KEY,
      createFavoriteStore,
    };
  }

  global.createFavoriteStore = createFavoriteStore;
})(typeof globalThis !== 'undefined' ? globalThis : window);
