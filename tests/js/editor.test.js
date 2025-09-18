const {
  createParameterState,
  buildCommandString,
  formatParameterValue,
} = require('../../src/js/editor.js');

describe('editor command composition', () => {
  const command = {
    name: 'Test-Command',
    parameters: [
      {
        name: 'Name',
        required: true,
        isSwitch: false,
        type: 'System.String',
        defaultValue: '',
        defaultRaw: '',
        defaultQuote: '',
        placeholder: 'example',
        placeholderQuote: '"',
      },
      {
        name: 'OptionalPath',
        required: false,
        isSwitch: false,
        type: 'System.String',
        defaultValue: '',
        defaultRaw: '',
        defaultQuote: '',
        placeholder: 'C:/Program Files/App',
        placeholderQuote: '"',
      },
      {
        name: 'Force',
        required: false,
        isSwitch: true,
        type: 'switch',
        defaultValue: '',
        defaultRaw: '',
        defaultQuote: '',
        placeholder: '',
        placeholderQuote: '',
      },
    ],
  };

  test('seeds required parameters with placeholder defaults', () => {
    const state = createParameterState(command);
    expect(state.Name).toEqual({ enabled: true, value: 'example' });
    expect(state.OptionalPath.enabled).toBe(false);
    expect(state.OptionalPath.value).toBe('C:/Program Files/App');
  });

  test('builds command string with required parameters only', () => {
    const state = createParameterState(command);
    const built = buildCommandString(command, state);
    expect(built).toBe('Test-Command -Name "example"');
  });

  test('includes optional values and switches when enabled', () => {
    const state = createParameterState(command);
    state.OptionalPath.enabled = true;
    state.OptionalPath.value = '';
    state.Force.enabled = true;
    const built = buildCommandString(command, state);
    expect(built).toBe(
      'Test-Command -Name "example" -OptionalPath "C:/Program Files/App" -Force'
    );
  });

  test('respects user supplied quoting', () => {
    const literal = formatParameterValue(command.parameters[1], "'custom value'");
    expect(literal).toBe("'custom value'");
    const state = createParameterState(command);
    state.OptionalPath.enabled = true;
    state.OptionalPath.value = "'custom value'";
    const built = buildCommandString(command, state);
    expect(built).toBe(
      "Test-Command -Name \"example\" -OptionalPath 'custom value'"
    );
  });
});
