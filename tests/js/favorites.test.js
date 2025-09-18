const { createFavoriteStore, STORAGE_KEY } = require('../../src/js/favorites');

describe('favorite store', () => {
  let storage;

  beforeEach(() => {
    storage = {
      data: {},
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(this.data, key)
          ? this.data[key]
          : null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      removeItem(key) {
        delete this.data[key];
      },
    };
  });

  test('loads favorites from storage', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify(['alpha', 'beta']));
    const store = createFavoriteStore(storage);
    expect(store.getAll()).toEqual(['alpha', 'beta']);
    expect(store.isFavorite('alpha')).toBe(true);
  });

  test('toggle updates persistence', () => {
    const store = createFavoriteStore(storage);
    expect(store.toggle('alpha')).toBe(true);
    expect(storage.getItem(STORAGE_KEY)).toBe(JSON.stringify(['alpha']));
    expect(store.toggle('alpha')).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBe(JSON.stringify([]));
  });

  test('remove ignores unknown ids', () => {
    const store = createFavoriteStore(storage);
    expect(store.remove('missing')).toBe(false);
    store.add('alpha');
    expect(store.remove('alpha')).toBe(true);
    expect(storage.getItem(STORAGE_KEY)).toBe(JSON.stringify([]));
  });
});
