Cloudcook PSADT Helper

A minimalist, premium-feel website to quickly compose PSADT (PowerShell App Deployment Toolkit) command snippets. Pick a use case, fill fields, and copy the generated command. Brand-aligned with Cloudcook.

Getting started
- Open `psadt-helper/index.html` in your browser.
- Choose a scenario (e.g., Install MSI) and fill in the inputs.
- Copy the generated command to your clipboard.

Notes
- Uses PSADT 4.1.x function names (e.g., `Start-ADTMsiProcess`, `Start-ADTProcess`, `Show-ADTInstallationPrompt`).
- Includes a converter to translate common PSADT 3.8/3.10 commands to 4.1 syntax.
- Scenarios now include presets for common silent switches, file copy and registry helpers, in addition to MSI and dialog helpers.
- Search the scenario list, validate GUID fields, and manage a script queue with reordering/removal.
- Scripts can be shared via a generated link, downloaded, or copied to the clipboard.
- This is designed to be easy to extend. See `psadt-helper/js/commands.js`.
