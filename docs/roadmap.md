# Roadmap

The following features are planned for future releases of the Cloudcook PSADT Helper:

1. **Scenario Library v2** – Expand templates with ready-made PSADT snippets for common installer types (MSI, EXE, MSIX, winget). Provide parameters such as `SilentSwitch`, `InstallDir`, and `RebootBehavior` selectable via the UI.
2. **One-Click Intune Packager** – Button that generates a full `install.cmd` plus PSADT wrapper scaffold, zipped and ready to upload as a Win32 app to Intune.
3. **Import/Export Configurations** – Save scenarios as JSON for later reuse or sharing.
4. **Shareable Links** – Generate URL parameters that encode current selections so links open with the same configuration.
5. **Downloadable Bundles** – Offer a "Download Bundle" option that creates a ZIP containing the generated script, README, and optional JSON config.
6. **Inline Validators & Hints** – Real-time feedback for common PSADT mistakes such as missing silent switches, casing errors, or invalid paths.
7. **Dark Mode & High Contrast Mode** – Theme toggle respecting system preferences and meeting WCAG AA accessibility.
8. **Quick Recipes Panel** – Mini-wizard with step-by-step patterns like "Install EXE with silent switch," "MSI + Desktop Shortcut," or "Uninstall with registry check."
9. **Localization Support** – String table enabling translation; initially English and German for labels, tooltips, and hints.
10. **Offline Mode (PWA)** – Convert the app into a Progressive Web App so it can be installed on desktops and used offline with cached assets.

