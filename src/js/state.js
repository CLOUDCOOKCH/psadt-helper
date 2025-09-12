(function(global){
  function buildScenarioHash(id, values = {}) {
    const params = new URLSearchParams({ scenario: id });
    Object.entries(values).forEach(([k, v]) => {
      if (!v) return;
      params.set(k, Array.isArray(v) ? v.join(',') : v);
    });
    return params.toString();
  }

  function parseScenarioHash(hash) {
    const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    const id = params.get('scenario');
    const values = {};
    params.forEach((v, k) => {
      if (k === 'scenario') return;
      values[k] = v.includes(',') ? v.split(',') : v;
    });
    return { id, values };
  }

  if (typeof module !== 'undefined') {
    module.exports = { buildScenarioHash, parseScenarioHash };
  }
  global.buildScenarioHash = buildScenarioHash;
  global.parseScenarioHash = parseScenarioHash;
})(typeof globalThis !== 'undefined' ? globalThis : window);
