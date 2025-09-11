Cloudcook PSADT Helper

A minimalist, premium-feel website to quickly compose PSADT (PowerShell App Deployment Toolkit) command snippets. Pick a use case, fill fields, and copy the generated command. Brand-aligned with Cloudcook.

Getting started
- Open `psadt-helper/index.html` in your browser.
- Choose a scenario (e.g., Install MSI) and fill in the inputs.
- Copy the generated command to your clipboard.

Notes
- Uses PSADT 4.1.x function names (e.g., `Start-ADTMsiProcess`, `Start-ADTProcess`, `Show-ADTInstallationPrompt`).
- Initial scenarios cover MSI install/uninstall/repair, MSP patch, process (system/user), and the main UI dialogs (Welcome/Progress/Prompt/Restart).
- This is designed to be easy to extend. See `psadt-helper/js/commands.js`.

Planned improvements
- Add more PSADT functions as scenarios (e.g., Show-InstallationWelcome, Restart prompts, file/registry helpers) after confirming parameter names for PSADT 4.1.
- Add presets for common silent switches of popular installers.
- Add URL hash/deeplinks to share a pre-filled scenario.
