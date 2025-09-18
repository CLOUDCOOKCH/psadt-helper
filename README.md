# Cloudcook PSADT Helper

A minimalist site to compose PSAppDeployToolkit (PSADT) command snippets and convert legacy 3.x syntax. Now includes linting, tests and CI.

## Quickstart

```powershell
pwsh ./make.ps1 -Install
```
This installs dependencies, runs JS tests and Pester tests.

## Offline caching & manifest

The site now exposes a Progressive Web App manifest (`manifest.json`) and a
service worker (`sw.js`) that precaches core assets (HTML, styles, telemetry
scripts, JSON data, and icons) for offline access. Users can control telemetry
and caching independently via the toggles in the header: turning off caching
persists a preference in `localStorage`, unregisters existing service workers,
and clears `psadt-cache-*` entries.

### Cache busting

Static updates should bump `CACHE_VERSION` in `sw.js`. Doing so creates a new
cache namespace (`psadt-cache-<version>`), allowing the activation handler to
discard outdated entries while keeping the offline toggle honouring the stored
preference.

## Project Layout

- `src/js` - browser JavaScript modules
- `src/ps` - PowerShell functions
- `tests/js` - Jest tests for JS helpers
- `tests/ps` - Pester tests
- `reports` - audit reports
- `docs/usage.md` - feature usage guide
- `docs/roadmap.md` - upcoming features roadmap

## Architecture

Static HTML (`index.html`) served via GitHub Pages. JS builds commands using scenario definitions. PowerShell module provides legacy converter.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
