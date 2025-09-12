let enabled = false;
function setTelemetry(value) {
  enabled = Boolean(value);
}
function logEvent(name, data = {}) {
  if (!enabled) return;
  console.log('telemetry', name, data);
}
if (typeof module !== 'undefined') {
  module.exports = { setTelemetry, logEvent };
}
if (typeof window !== 'undefined') {
  window.setTelemetry = setTelemetry;
  window.logEvent = logEvent;
}
