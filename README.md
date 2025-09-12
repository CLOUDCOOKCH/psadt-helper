# Cloudcook PSADT Helper

A minimalist site to compose PSAppDeployToolkit (PSADT) command snippets and convert legacy 3.x syntax. Now includes linting, tests and CI.

## Quickstart

```powershell
pwsh ./make.ps1 -Install
```
This installs dependencies, runs JS tests and Pester tests.

## Project Layout

- `src/js` - browser JavaScript modules
- `src/ps` - PowerShell functions
- `tests/js` - Jest tests for JS helpers
- `tests/ps` - Pester tests
- `reports` - audit reports

## Architecture

Static HTML (`index.html`) served via GitHub Pages. JS builds commands using scenario definitions. PowerShell module provides legacy converter.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
