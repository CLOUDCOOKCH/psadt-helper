const path = require('path');

const createMemoryStorage = () => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

describe('service worker registration bootstrap', () => {
  beforeEach(() => {
    jest.resetModules();
    global.localStorage = createMemoryStorage();
    global.navigator = {
      serviceWorker: {
        register: jest.fn().mockResolvedValue({}),
        getRegistrations: jest.fn().mockResolvedValue([]),
      },
    };
    global.window = {
      navigator: global.navigator,
    };
    global.caches = {
      keys: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(true),
    };
  });

  afterEach(() => {
    delete global.localStorage;
    delete global.navigator;
    delete global.window;
    delete global.caches;
  });

  it('registers the service worker at the root sw.js path', async () => {
    await require(path.join('../../src/js/sw-registration.js'));
    await Promise.resolve();
    expect(global.navigator.serviceWorker.register).toHaveBeenCalledWith('sw.js');
  });
});

describe('service worker precache list', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('includes critical application shell assets', () => {
    const { PRECACHE_URLS } = require(path.join('../../sw.js'));
    expect(PRECACHE_URLS).toEqual(
      expect.arrayContaining([
        'index.html',
        'styles.css',
        'src/js/main.js',
        'src/js/sw-registration.js',
        'src/data/command-metadata.json',
        'src/data/legacy-mapping.json',
        'assets/cloudcook-logo.png',
        'assets/app-icon.svg',
      ]),
    );
  });
});
