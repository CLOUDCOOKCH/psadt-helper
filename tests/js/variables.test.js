/** @jest-environment jsdom */

const buildMatchMedia = () => ({
  matches: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
});

const baseMarkup = `
  <div id="app">
    <aside>
      <input id="scenario-search" />
      <div id="scenario-list"></div>
    </aside>
    <section>
      <div id="intro"></div>
      <div id="scenario-details"></div>
      <pre id="command"></pre>
      <div id="output"></div>
      <button id="copy-btn"></button>
      <button id="add-btn"></button>
      <button id="share-btn"></button>
      <button id="reset-btn"></button>
      <button id="export-btn"></button>
      <button id="import-btn"></button>
      <input id="import-file" type="file" />
      <div id="script"></div>
      <div id="script-commands"></div>
      <button id="copy-script-btn"></button>
      <button id="download-script-btn"></button>
      <button id="share-script-btn"></button>
      <input id="accent" />
      <div id="accent-swatches"></div>
      <input id="background" />
      <div id="bg-swatches"></div>
      <select id="header-color-mode"></select>
      <label for="telemetry-toggle"></label>
      <input type="checkbox" id="telemetry-toggle" />
      <div class="variable-card">
        <span id="variable-count" aria-live="polite"></span>
        <div class="variable-search">
          <input id="variable-search" />
        </div>
        <div id="variable-results"></div>
        <div id="variable-detail" class="variable-detail empty">
          <p class="variable-empty">Select a variable to see details.</p>
        </div>
      </div>
    </section>
  </div>
  <div
    id="variable-modal"
    class="modal hidden"
    role="dialog"
    aria-modal="true"
    aria-labelledby="variable-modal-title"
  >
    <div class="modal-overlay" data-modal-dismiss></div>
    <div class="modal-container" role="document">
      <button
        type="button"
        class="modal-close"
        id="variable-modal-close"
        data-modal-dismiss
      ></button>
      <div id="variable-modal-body" class="modal-body"></div>
    </div>
  </div>
`;

describe('variable helper search', () => {
  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = baseMarkup;
    window.PSADT_SCENARIOS = [];
    window.setTelemetry = jest.fn();
    window.logEvent = jest.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(() => buildMatchMedia()),
    });
  });

  test('filters variables across metadata and updates counts', () => {
    window.PSADT_VARIABLES = [
      {
        id: 'alpha',
        title: 'Alpha Section',
        variables: [
          {
            variable: '$AlphaVar',
            description: 'Primary entry',
          },
        ],
      },
      {
        id: 'beta',
        title: 'Delta',
        variables: [
          {
            variable: '$BetaVar',
            description: 'Covers wizardry workflows',
          },
        ],
      },
      {
        id: 'gamma',
        title: 'Tools',
        variables: [
          {
            variable: '$GammaVar',
            description: 'Fallback helper',
          },
        ],
      },
    ];

    require('../../src/js/main');

    const count = () => document.getElementById('variable-count').textContent;
    const items = () =>
      Array.from(document.querySelectorAll('.variable-item')).map((el) =>
        el.textContent.trim(),
      );

    expect(count()).toBe('3 variables');
    expect(items()).toEqual(['$AlphaVar', '$BetaVar', '$GammaVar']);

    const search = document.getElementById('variable-search');

    search.value = 'alpha';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(items()).toEqual(['$AlphaVar']);
    expect(count()).toBe('1 match');

    search.value = 'wizardry';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(items()).toEqual(['$BetaVar']);
    expect(count()).toBe('1 match');

    search.value = 'missing';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.querySelectorAll('.variable-item')).toHaveLength(0);
    expect(
      document.querySelector('#variable-results .variable-empty').textContent,
    ).toBe('No variables match your search.');
    expect(count()).toBe('0 matches');
    expect(
      document.querySelector('#variable-detail .variable-empty').textContent,
    ).toBe('Adjust your search to explore variable details.');

    search.value = '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(count()).toBe('3 variables');
    expect(items()).toEqual(['$AlphaVar', '$BetaVar', '$GammaVar']);
  });

  test('clears active selection when filtered out', () => {
    window.PSADT_VARIABLES = [
      {
        id: 'alpha',
        title: 'Alpha',
        variables: [
          {
            variable: '$AlphaVar',
            description: 'First item',
          },
        ],
      },
      {
        id: 'beta',
        title: 'Beta',
        variables: [
          {
            variable: '$BetaVar',
            description: 'Second item',
          },
        ],
      },
    ];

    require('../../src/js/main');

    const firstButton = document.querySelector('.variable-item');
    firstButton.click();

    expect(firstButton.classList.contains('active')).toBe(true);
    expect(document.getElementById('variable-detail').classList.contains('empty')).toBe(false);

    const search = document.getElementById('variable-search');
    search.value = 'beta';
    search.dispatchEvent(new Event('input', { bubbles: true }));

    expect(document.querySelector('.variable-item.active')).toBeNull();
    expect(
      document.querySelector('#variable-detail .variable-empty').textContent,
    ).toBe('Select a variable to see details.');
    expect(document.getElementById('variable-count').textContent).toBe(
      '1 match',
    );
    expect(
      document.getElementById('variable-modal').classList.contains('hidden'),
    ).toBe(true);
  });
});
