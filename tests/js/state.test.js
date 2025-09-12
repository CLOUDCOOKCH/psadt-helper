const { buildScenarioHash, parseScenarioHash } = require('../../src/js/state');

describe('state helpers', () => {
  test('buildScenarioHash serializes values', () => {
    const hash = buildScenarioHash('abc', { foo: 'bar', list: ['a','b'] });
    expect(hash).toBe('scenario=abc&foo=bar&list=a%2Cb');
  });

  test('parseScenarioHash parses back', () => {
    const { id, values } = parseScenarioHash('scenario=abc&foo=bar&list=a%2Cb');
    expect(id).toBe('abc');
    expect(values).toEqual({ foo: 'bar', list: ['a','b'] });
  });
});
