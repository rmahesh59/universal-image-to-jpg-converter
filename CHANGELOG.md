# Changelog

All meaningful changes to this project should be recorded here.

## 2026-04-07

### Added
- Cross-platform root development launcher with `dev.mjs` so `npm run dev` works cleanly on both Windows and macOS.
- Root `npm run install:all` helper for installing frontend and backend dependencies in one step.
- In-app About / Getting Started panel for first-time users.
- Clearer folder path guidance with Windows and macOS examples directly in the UI.
- Reduced-motion support for animated UI elements.

### Changed
- Root `dev.mjs` launcher now starts npm through `cmd.exe` on Windows for better compatibility with Windows environments.
- README rewritten to be more beginner-friendly with clearer Windows and macOS setup instructions.
- Architecture document updated to reflect the root launcher, onboarding panel, immediate job fetch, and browser-local stored state.
- Job polling now fetches once immediately on load instead of waiting for the first interval.

## 2026-03-31

### Added
- Root Git repository initialized and pushed to GitHub.
- One-command root dev startup with `npm run dev`.
- Recent source and destination path memory.
- Recent source-destination folder pair shortcuts.
- Scan file selection with `Select All` and `Clear All`.
- Rich scan summary with supported-image counts and ignored file counts.
- File table search and status filtering.
- Retry failed files action.
- Open output folder helper action.
- Event celebration popups for job start, duplicate alerts, and successful completion.
- Richer light-theme UI with animated idle-state visuals.
- Better final job summary cards and metrics.
- Performance mode setting with `quiet`, `balanced`, and `fast` options.

### Changed
- Architecture document updated to reflect current backend/frontend behavior.
- README expanded into a full usage and installation guide.
- Frontend styling moved from a dark visual direction to a lighter, warmer design.
- Scan logic now ignores hidden macOS sidecar files like `._IMG_1234.JPG`.
- Scan flow now reports all file-type counts while only converting supported image files.
- Batch processing improved for better throughput with controlled parallelism in non-interactive duplicate modes.
- JPG/JPEG pass-through handling optimized using direct file copy.
- Batch processing now adapts queue concurrency to the machine for non-interactive duplicate modes.
- Final job summary now shows performance metrics such as copy count, conversion count, hashing time, write time, duplicate wait time, and throughput.
- Performance tuning now lets the user trade off laptop responsiveness versus throughput directly from the UI.

### Documentation
- Added maintenance checklist to keep docs synchronized with code changes.
- Added document review marker in architecture documentation.
- Added root changelog for feature and behavior tracking.
