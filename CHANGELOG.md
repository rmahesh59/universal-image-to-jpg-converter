# Changelog

All meaningful changes to this project should be recorded here.

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
