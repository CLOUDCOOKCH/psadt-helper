(function (global) {
  function renderScenarioList(container, options = {}) {
    if (!container) return;

    const {
      scenarios = [],
      term = '',
      favorites = [],
      showFavoritesOnly = false,
      activeId = null,
      onSelect,
      onToggleFavorite,
    } = options;

    const favoritesSet = favorites instanceof Set ? favorites : new Set(favorites);
    const normalizedTerm = term ? term.toLowerCase() : '';

    const filtered = scenarios.filter((scenario) => {
      if (!normalizedTerm) return true;
      const description = scenario.description || '';
      return (
        scenario.name.toLowerCase().includes(normalizedTerm) ||
        description.toLowerCase().includes(normalizedTerm)
      );
    });

    const favoriteItems = filtered.filter((scenario) => favoritesSet.has(scenario.id));
    const regularItems = filtered.filter((scenario) => !favoritesSet.has(scenario.id));

    container.innerHTML = '';

    const sections = [];

    if (showFavoritesOnly) {
      if (favoriteItems.length) {
        sections.push({ title: 'Favorites', items: favoriteItems });
      } else {
        const empty = document.createElement('div');
        empty.className = 'scenario-empty';
        empty.textContent =
          favoritesSet.size > 0
            ? 'No favorites match your search.'
            : 'No favorite scenarios yet.';
        container.appendChild(empty);
        return;
      }
    } else {
      if (favoriteItems.length) {
        sections.push({ title: 'Favorites', items: favoriteItems });
      }
      if (regularItems.length) {
        sections.push({ title: favoriteItems.length ? 'All scenarios' : null, items: regularItems });
      }
    }

    if (!sections.length) {
      const empty = document.createElement('div');
      empty.className = 'scenario-empty';
      empty.textContent = scenarios.length
        ? 'No scenarios match your search.'
        : 'No scenarios available.';
      container.appendChild(empty);
      return;
    }

    sections.forEach((section) => {
      const sectionEl = document.createElement('div');
      sectionEl.className = 'scenario-section';

      if (section.title) {
        const heading = document.createElement('div');
        heading.className = 'scenario-section-title';
        heading.textContent = section.title;
        sectionEl.appendChild(heading);
      }

      section.items.forEach((scenario) => {
        sectionEl.appendChild(
          createScenarioItem(scenario, {
            activeId,
            favoritesSet,
            onSelect,
            onToggleFavorite,
          }),
        );
      });

      container.appendChild(sectionEl);
    });
  }

  function createScenarioItem(scenario, context) {
    const { activeId, favoritesSet, onSelect, onToggleFavorite } = context;
    const isActive = activeId === scenario.id;
    const isFavorite = favoritesSet.has(scenario.id);

    const item = document.createElement('div');
    item.className = 'scenario-item';
    if (isActive) item.classList.add('active');
    if (isFavorite) item.classList.add('favorite');
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-pressed', isActive ? 'true' : 'false');

    const header = document.createElement('div');
    header.className = 'scenario-item-header';

    const name = document.createElement('span');
    name.className = 'scenario-name';
    name.textContent = scenario.name;

    const favoriteBtn = document.createElement('button');
    favoriteBtn.type = 'button';
    favoriteBtn.className = 'scenario-favorite-btn' + (isFavorite ? ' is-favorite' : '');
    favoriteBtn.setAttribute('aria-label', isFavorite ? 'Remove from favorites' : 'Add to favorites');
    favoriteBtn.setAttribute('aria-pressed', isFavorite ? 'true' : 'false');
    favoriteBtn.innerHTML =
      '<svg class="icon" aria-hidden="true"><use href="' +
      (isFavorite ? '#ic-star' : '#ic-star-outline') +
      '"></use></svg>';

    favoriteBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (typeof onToggleFavorite === 'function') {
        onToggleFavorite(scenario.id);
      }
    });

    favoriteBtn.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.stopPropagation();
      }
    });

    header.appendChild(name);
    header.appendChild(favoriteBtn);

    const desc = document.createElement('span');
    desc.className = 'scenario-desc';
    desc.textContent = scenario.description || '';

    item.appendChild(header);
    item.appendChild(desc);

    item.addEventListener('click', () => {
      if (typeof onSelect === 'function') {
        onSelect(scenario.id);
      }
    });

    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (typeof onSelect === 'function') {
          onSelect(scenario.id);
        }
      }
    });

    return item;
  }

  if (typeof module !== 'undefined') {
    module.exports = {
      renderScenarioList,
    };
  }

  global.renderScenarioList = renderScenarioList;
})(typeof globalThis !== 'undefined' ? globalThis : window);
