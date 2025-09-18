/** @jest-environment jsdom */

const { renderScenarioList } = require('../../src/js/scenario-list');

describe('renderScenarioList', () => {
  const scenarios = [
    { id: 'alpha', name: 'Alpha', description: 'First scenario' },
    { id: 'beta', name: 'Beta', description: 'Second scenario' },
    { id: 'gamma', name: 'Gamma', description: 'Third scenario' },
  ];

  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  test('groups favorites into their own section', () => {
    renderScenarioList(container, {
      scenarios,
      favorites: new Set(['alpha']),
      activeId: 'beta',
      onSelect: jest.fn(),
      onToggleFavorite: jest.fn(),
    });

    const sections = container.querySelectorAll('.scenario-section');
    expect(sections).toHaveLength(2);
    expect(sections[0].querySelector('.scenario-section-title').textContent).toBe(
      'Favorites',
    );
    expect(
      sections[0].querySelector('.scenario-item .scenario-name').textContent,
    ).toBe('Alpha');
    expect(sections[1].querySelectorAll('.scenario-item').length).toBe(2);
    expect(
      sections[1].querySelector('.scenario-item.active .scenario-name').textContent,
    ).toBe('Beta');
  });

  test('shows message when favorites-only filter has no matches', () => {
    renderScenarioList(container, {
      scenarios,
      favorites: new Set(),
      showFavoritesOnly: true,
    });

    const empty = container.querySelector('.scenario-empty');
    expect(empty).not.toBeNull();
    expect(empty.textContent).toBe('No favorite scenarios yet.');
  });

  test('favorite button triggers callback without selecting scenario', () => {
    const handleSelect = jest.fn();
    const handleToggle = jest.fn();

    renderScenarioList(container, {
      scenarios,
      favorites: new Set(),
      onSelect: handleSelect,
      onToggleFavorite: handleToggle,
    });

    const firstItem = container.querySelector('.scenario-item');
    firstItem.click();
    expect(handleSelect).toHaveBeenCalledWith('alpha');

    handleSelect.mockClear();
    const favoriteBtn = container.querySelector('.scenario-favorite-btn');
    favoriteBtn.click();
    expect(handleToggle).toHaveBeenCalledWith('alpha');
    expect(handleSelect).not.toHaveBeenCalled();
  });
});
