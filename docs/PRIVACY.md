# Privacy And Security

StatAnveshak is designed as a local-first browser application.

## Current Behavior

- Imported files are read through browser file APIs.
- Saved datasets and projects live in IndexedDB.
- Preferences and learning progress live in localStorage.
- Exports are generated with browser APIs.
- The app does not upload datasets to a server.

## Security Notes

- Treat imported file names, column names, and data values as untrusted input.
- Escape generated report HTML before embedding user-controlled text.
- Keep dependency updates reviewed because spreadsheet and charting libraries parse complex inputs.
- Avoid enabling external network calls in analysis flows without explicit user consent.

