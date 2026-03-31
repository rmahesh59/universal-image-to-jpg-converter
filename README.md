# Universal Image to JPG Converter

Convert HEIC, HEIF, PNG, WEBP, BMP, TIFF, and JPEG-family images into JPG files using a local web app that runs on your laptop and can also be controlled from your phone on the same network.

## What This App Does
- Scans a source folder for supported image files
- Shows a preview list before conversion starts
- Converts supported formats to JPG
- Passes through existing JPG and JPEG files without re-encoding
- Detects exact duplicates using SHA-256 file hashes
- Lets you decide how to handle duplicates
- Supports multiple batch jobs running in parallel
- Tracks live progress for each job
- Can cancel a running job
- Can optionally delete original files after successful output write
- Can be opened from another device on the same Wi-Fi network

## Supported Input Formats
- `.heic`
- `.heif`
- `.jpg`
- `.jpeg`
- `.png`
- `.webp`
- `.bmp`
- `.tiff`
- `.tif`

Output format:
- `.jpg`

## How The App Works
This project has two parts:
- `frontend/`: the web UI built with React + Vite
- `backend/`: the local API server built with Express + TypeScript

The backend runs on your laptop and performs scanning, duplicate detection, conversion, output writing, and job tracking.

The frontend is the screen you use in the browser. It talks to the backend on port `4000`.

## Phone and Laptop Usage
Your phone is not mirroring the laptop screen. Both devices are just separate clients connected to the same backend running on your laptop.

What syncs across devices:
- created jobs
- job progress
- duplicate prompts
- completed and cancelled job history in memory

What does not sync automatically:
- source and destination paths currently typed into a browser tab
- scan preview results before a job is started
- local error messages

That means:
- if you click `Scan Images` on one device, only that device sees the scan preview
- once you click `Start Conversion`, all connected devices can see the job progress

## Main Features
### 1. Folder Scanning
- Scans a chosen source folder
- Optionally includes subfolders
- Returns a preview list before conversion starts

### 2. Batch Conversion
- Starts a job using the scanned file list
- Processes files one by one inside that job
- Shows current file, counts, and status

### 3. Parallel Jobs
- You can start another job while a previous job is still running
- Each job appears as its own card in the UI

### 4. Duplicate Detection
- Uses SHA-256 content hashing
- Detects duplicates within the current job
- Also checks destination files that match the app's naming pattern

Duplicate handling modes:
- `Ask every time`
- `Skip all exact duplicates`
- `Keep all exact duplicates with suffix`

### 5. Duplicate Review Modal
When duplicate mode is `Ask every time`, the app pauses the job and shows:
- existing file preview when available
- incoming file preview when available
- `Skip New Image`
- `Skip ALL Duplicates`
- `Keep Both`
- `Keep ALL Duplicates`

### 6. Safe Original Deletion
Original files are deleted only when:
- output write succeeded
- output file exists
- output file is not empty
- `Delete original after successful conversion` is enabled
- `Keep original` is not enabled

### 7. Cross-Device Control
- Open the app from the laptop browser or a phone browser
- As long as both devices are on the same network and the phone can reach the laptop, the phone can monitor and control running jobs

## Installation
### Requirements
- Node.js installed on the laptop
- npm installed
- macOS recommended for the current local usage pattern

Optional but important:
- phone and laptop on the same Wi-Fi network if you want phone access

### 1. Install Backend Dependencies
```bash
cd "/Users/mahesh/Downloads/Convert Iphone images to JPJ Format/backend"
npm install
```

### 2. Install Frontend Dependencies
```bash
cd "/Users/mahesh/Downloads/Convert Iphone images to JPJ Format/frontend"
npm install
```

## Running The App
You need two terminals.

### One Command Option
From the project root:

```bash
cd "/Users/mahesh/Downloads/Convert Iphone images to JPJ Format"
npm run dev
```

This starts:
- backend on port `4000`
- frontend on port `5173`

Press `Ctrl+C` once in that terminal to stop both together.

### Terminal 1: Start Backend
```bash
cd "/Users/mahesh/Downloads/Convert Iphone images to JPJ Format/backend"
npm run dev
```

Backend default:
- port `4000`

### Terminal 2: Start Frontend
```bash
cd "/Users/mahesh/Downloads/Convert Iphone images to JPJ Format/frontend"
npm run dev
```

Open the frontend URL shown by Vite in your browser on the laptop.

## How To Use The App
### Normal Flow
1. Start backend and frontend.
2. Open the app in your browser.
3. Enter the source folder path.
4. Enter the destination folder path.
5. Choose settings.
6. Click `Scan Images`.
7. Review the scanned file preview.
8. Click `Start Conversion`.
9. Watch progress in the job card.
10. If a duplicate appears, choose how to handle it.
11. Wait for completion and review the summary.

### Starting More Than One Job
1. Finish scanning and start the first job.
2. Enter another source or destination.
3. Scan again.
4. Start another job.

The jobs run as separate tracked batches in the backend.

## Settings Explained
### JPEG Quality
- Range: `60` to `100`
- Used when the app converts non-JPG images into JPG

### Duplicate Handling
- `Ask every time`: pause and ask for each duplicate
- `Skip all exact duplicates`: skip incoming duplicate files
- `Keep all exact duplicates with suffix`: keep duplicates using indexed filenames

### Include Subfolders
- When enabled, the scanner walks nested folders too

### Delete Original After Successful Conversion
- Removes the original input file only after a safe successful write

### Keep Original
- Overrides delete behavior and preserves source files

## Output Naming
The backend uses a generated output filename that includes:
- a timestamp component
- a sanitized version of the original base name
- a hash-based suffix
- a duplicate suffix when needed

This helps keep filenames stable, informative, and collision-resistant.

## API Endpoints
### `POST /api/scan`
Request body:
- `sourcePath`
- `includeSubfolders`

Purpose:
- scan source folder and return matching files

### `POST /api/jobs`
Request body:
- `sourcePath`
- `destinationPath`
- `settings`
- `files`

Purpose:
- create and start a new job

### `GET /api/jobs`
Purpose:
- return all jobs currently known to the backend

### `GET /api/jobs/:jobId`
Purpose:
- return one job's current state

### `POST /api/jobs/:jobId/duplicate`
Request body:
- `action`

Purpose:
- resolve a waiting duplicate decision

### `POST /api/jobs/:jobId/cancel`
Purpose:
- cancel a running job

### `GET /health`
Purpose:
- simple backend health check

## Project Structure
```text
Convert Iphone images to JPJ Format/
├── README.md
├── CONTRIBUTING.md
├── HEIC_TO_JPG_APP_ARCHITECTURE.md
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.ts
│       ├── routes.ts
│       ├── types.ts
│       └── services/
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.tsx
│       ├── api.ts
│       ├── types.ts
│       └── components/
```

## Important Behavior Notes
### 1. No Database
The app does not use a database.

Job state is stored only in backend memory while the backend is running.

### 2. Backend Restart Behavior
If the backend restarts:
- running and previous job state is lost
- already created JPG files stay on disk

### 3. Local Filesystem Scope
The backend works with folders accessible from the laptop where it is running.

The phone can control the app, but the actual file operations still happen on the laptop.

### 4. Polling-Based Updates
The frontend polls the backend every 1.2 seconds for job updates.

There is no WebSocket or SSE channel right now.

## Troubleshooting
### The Phone Can Open The Frontend But Jobs Do Not Update
Check:
- backend is running on the laptop
- phone and laptop are on the same network
- phone is opening the app using the laptop's reachable hostname or IP
- port `4000` is reachable from the phone

### Scan Works But Other Device Does Not Show The Preview
This is expected.

Scan preview is stored only in the browser tab that performed the scan.

### Conversion Starts But Files Are Not Written
Check:
- destination folder path is correct
- backend process has filesystem permission
- source files still exist at the scanned paths

### Originals Were Not Deleted
Check:
- `Delete original after successful conversion` is enabled
- `Keep original` is not enabled
- output file was written successfully

## Documentation Files
- [README.md](/Users/mahesh/Downloads/Convert%20Iphone%20images%20to%20JPJ%20Format/README.md): install, run, usage, features, and operational guide
- [HEIC_TO_JPG_APP_ARCHITECTURE.md](/Users/mahesh/Downloads/Convert%20Iphone%20images%20to%20JPJ%20Format/HEIC_TO_JPG_APP_ARCHITECTURE.md): technical architecture and shared-state behavior
- [CONTRIBUTING.md](/Users/mahesh/Downloads/Convert%20Iphone%20images%20to%20JPJ%20Format/CONTRIBUTING.md): maintenance checklist for future changes

## Documentation Maintenance Rule
If app behavior changes, update:
- `README.md` for user-facing flow or setup changes
- `HEIC_TO_JPG_APP_ARCHITECTURE.md` for technical behavior changes
- `CONTRIBUTING.md` if the maintenance process changes
