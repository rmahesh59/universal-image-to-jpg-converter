# Universal Image to JPG App Architecture

## Document Status
- Last reviewed: 2026-03-27
- Reviewed against:
  - `frontend/src/App.tsx`
  - `frontend/src/api.ts`
  - `backend/src/server.ts`
  - `backend/src/routes.ts`
  - `backend/src/services/batchManager.ts`
  - `backend/src/services/scannerService.ts`
  - `backend/src/services/converterService.ts`

## Purpose
This app scans local folders on the laptop, converts supported image formats into JPG, detects exact duplicates by file hash, and manages long-running batch jobs through a shared backend. It is designed for local-network use, so the UI can be opened from the laptop itself or from another device, such as a phone on the same Wi-Fi network.

## Supported Inputs
- HEIC
- HEIF
- JPG
- JPEG
- PNG
- WEBP
- BMP
- TIFF
- TIF

JPG and JPEG inputs are not re-encoded. They are copied through as-is after duplicate handling and output naming.

## High-Level Architecture
- `frontend/`: React + TypeScript + Vite single-page app.
- `backend/`: Node.js + Express + TypeScript API server.
- Storage model: no database; active job state is held in backend memory and durable outputs are written to the filesystem.

## How Laptop and Phone Work Together
The phone is not screen-mirroring the laptop. Both devices are simply opening the same frontend and talking to the same backend running on the laptop.

The connection works like this:
1. The backend runs on port `4000` on the laptop.
2. The frontend sends API calls to `http://<current-hostname>:4000/api`.
3. If the phone opens the app using the laptop's IP or hostname on the same network, the phone's browser also talks directly to the laptop backend.
4. The backend enables `cors({ origin: "*" })`, so local-network browsers can call it.

## What Is Shared Across Devices
These parts are shared because they live in backend memory:
- Created conversion jobs
- Job progress
- Current file being processed
- Duplicate-review prompts for active jobs
- Completed / failed / cancelled job state

This shared state is exposed by:
- `GET /api/jobs`
- `GET /api/jobs/:jobId`

The frontend polls `GET /api/jobs` every 1.2 seconds, so all connected devices can see the same job list and progress once jobs exist.

## What Is Not Shared Across Devices
These parts are local to the browser tab that triggered them:
- Source folder text box
- Destination folder text box
- Settings currently typed in the UI
- Scan preview results shown before conversion starts
- Local error banner state

Important detail:
- `POST /api/scan` does call the backend.
- But the scan result is returned only to the browser tab that requested it.
- The result is stored in React state (`scannedFiles`, `scanStatus`) and is not saved in backend memory.

So if you scan on the laptop, the phone does not automatically get the scanned preview. Cross-device "sync" becomes visible mainly after a job is created, because jobs are stored centrally in the backend `jobCoordinator`.

## Frontend Architecture
Main file:
- `frontend/src/App.tsx`

Main responsibilities:
- Capture source and destination folder paths
- Capture conversion settings
- Trigger scan
- Trigger job creation
- Poll the backend for job updates
- Show duplicate resolution modal when a running job pauses for a decision

Key components:
- `FolderPicker`: source / destination path entry
- `SettingsPanel`: JPEG quality, duplicate mode, subfolder and delete/keep options
- `FileTable`: scanned file preview and per-job file list
- `JobCard`: expandable job view with cancel action
- `SummaryCards`: top-level job counters
- `ProgressPanel`: progress meter and current file
- `FinalSummary`: end-of-job summary
- `DuplicateReviewModal`: duplicate comparison with `skip`, `keep`, `skip_all`, `keep_all`

## Backend Architecture
Entry points:
- `backend/src/server.ts`
- `backend/src/routes.ts`

Backend responsibilities:
- Validate incoming requests
- Expand `~` paths where supported
- Scan source folders
- Create and track jobs in memory
- Process conversion batches
- Pause for duplicate decisions
- Cancel running jobs

Core services:
- `scannerService.ts`: recursively or non-recursively finds supported image files
- `converterService.ts`: converts to JPG using `sharp`, with `heic-convert` fallback, and also builds duplicate preview thumbnails
- `hashService.ts`: computes SHA-256 hashes
- `fileNameService.ts`: generates output filenames
- `batchManager.ts`: owns `BatchJob` and the in-memory `jobCoordinator`

## Batch Job Model
Each created job has:
- `batchId`
- `sourcePath`
- `destinationPath`
- totals and counters
- per-file status list
- current file
- status (`idle`, `running`, `completed`, `cancelled`, `failed`)
- timestamps
- optional `waitingDuplicate` prompt

Jobs are created in memory by `jobCoordinator.createJob(...)` and returned from `jobCoordinator.getAllJobs()`.

There is currently no persistent restart-safe job storage. If the backend restarts, in-memory job state is lost, but already written JPG files remain on disk.

## Duplicate Detection and Naming
Duplicate detection is content-based:
- the backend reads file bytes
- computes SHA-256
- uses the full hash for in-job duplicate detection
- uses a 24-character hash prefix to compare against already existing destination JPG files

Duplicate handling modes:
- `ask`
- `skip_all`
- `keep_all`

When `ask` is active, the job pauses and exposes a `waitingDuplicate` prompt. The frontend shows both previews and lets the user choose:
- `skip`
- `keep`
- `skip_all`
- `keep_all`

If duplicates are kept, filename generation uses a duplicate index so multiple files with the same hash prefix can coexist.

## Conversion Workflow
1. User enters source and destination paths.
2. User clicks `Scan Images`.
3. Backend scans the source folder and returns matching files.
4. The requesting frontend stores those scanned files locally and shows a preview table.
5. User clicks `Start Conversion`.
6. Frontend sends the scanned file list plus settings to `POST /api/jobs`.
7. Backend creates a `BatchJob` and starts processing asynchronously.
8. All open clients polling `GET /api/jobs` can see the job progress.
9. If a duplicate needs review, the active prompt appears on all connected clients because it is part of shared backend job state.
10. When the batch finishes, output JPG files remain in the destination folder and the final job summary remains available until backend restart.

## File Processing Rules
For each file:
- read source bytes
- hash contents
- detect duplicates against current job and indexed destination files
- generate output filename
- convert to JPG if needed
- write output
- verify output exists and has size greater than zero
- optionally delete original after success

## Safe Delete Logic
Original deletion happens only when:
- conversion/write succeeded
- the output file exists
- the output file is non-empty
- `deleteOriginalAfterSuccess` is enabled
- `keepOriginal` is not enabled

## API Summary
- `POST /api/scan`
  - body: `sourcePath`, `includeSubfolders`
  - returns: scanned files and `resolvedSourcePath`

- `POST /api/jobs`
  - body: `sourcePath`, `destinationPath`, `settings`, `files`
  - returns: `jobId`

- `GET /api/jobs`
  - returns: all known jobs in reverse start-time order

- `GET /api/jobs/:jobId`
  - returns: one job's progress

- `POST /api/jobs/:jobId/duplicate`
  - body: duplicate decision action
  - returns: decision acknowledgement

- `POST /api/jobs/:jobId/cancel`
  - returns: cancellation acknowledgement

- `GET /health`
  - returns: `{ ok: true }`

## Current Limitations
- No database or persisted job history
- No real-time push channel such as WebSocket or SSE; updates rely on polling
- Scan previews are not synchronized across devices
- Folder access happens on the laptop filesystem where the backend is running; a phone can control the app, but it is still operating on laptop-accessible paths

## Documentation Maintenance Expectation
`HEIC_TO_JPG_APP_ARCHITECTURE.md` should be updated whenever behavior, API shape, shared-state rules, or major UI/backend responsibilities change.

In practice, that means we should proactively keep this file aligned with code changes, especially when changing:
- sync behavior between devices
- backend endpoints
- duplicate handling flow
- job lifecycle
- supported formats
- deletion rules
