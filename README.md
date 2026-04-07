# Universal Image to JPG Converter

Convert iPhone photos and common image files into JPG files on your own computer.

This app runs locally:
- the backend scans folders and processes files on your computer
- the frontend gives you a simple browser interface to review and start jobs

No online image conversion service is used. Your files stay on your machine.

## Overview
This project is for people who want a clean, visual way to convert batches of images into JPG files without using command-line tools or uploading photos to a website.

The app helps you:
- scan a folder before converting
- review a file list before starting
- choose exactly which files to include
- detect exact duplicates
- track progress while a batch runs
- review a final summary when the job finishes

## Features
- Converts `HEIC`, `HEIF`, `PNG`, `WEBP`, `BMP`, `TIFF`, and `TIF` into JPG
- Copies existing `JPG` and `JPEG` files through without re-encoding
- Ignores hidden dotfiles and Apple sidecar files such as `._IMG_1234.JPG`
- Uses SHA-256 hashes for exact duplicate detection
- Supports duplicate modes: ask, skip all, or keep all with suffix
- Supports performance modes: `Quiet`, `Balanced`, and `Fast`
- Remembers recent folders and last-used settings in the browser
- Can be opened on another device on the same local network
- Includes an in-app About / Getting Started section for first-time users

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

## What You Need
- a Mac or Windows computer
- [Node.js LTS](https://nodejs.org/) installed
- internet access only for the one-time dependency install

After setup, the actual conversion work is fully local on your computer.

## Quick Start
If you already know how to use Terminal or Command Prompt:

```bash
cd "PATH_TO_THIS_PROJECT"
npm run install:all
npm run dev
```

Then open:

```text
http://localhost:5173
```

## macOS Setup
These steps are written for someone with no technical background.

### 1. Install Node.js
1. Go to [https://nodejs.org/](https://nodejs.org/).
2. Download the current **LTS** version.
3. Open the installer and finish the setup.

### 2. Open the project folder
1. Save or unzip this project somewhere easy to find, such as `Downloads` or `Documents`.
2. Open `Finder`.
3. Open the project folder.

### 3. Open Terminal
1. Press `Command + Space`.
2. Type `Terminal`.
3. Press `Return`.

### 4. Move into the project folder
Type `cd ` in Terminal, then drag the project folder into the Terminal window, then press `Return`.

Example:

```bash
cd "/Users/yourname/Downloads/Convert Iphone images to JPJ Format"
```

### 5. Install the app dependencies
Paste this command and press `Return`:

```bash
npm run install:all
```

Wait until it finishes.

### 6. Start the app
Paste this command and press `Return`:

```bash
npm run dev
```

You should see messages for:
- backend on port `4000`
- frontend on port `5173`

### 7. Open the app
Open your browser and go to:

```text
http://localhost:5173
```

## Windows Setup
These steps are also written for a beginner.

### 1. Install Node.js
1. Go to [https://nodejs.org/](https://nodejs.org/).
2. Download the current **LTS** version for Windows.
3. Open the installer.
4. Keep the default options and finish the setup.

### 2. Open the project folder
1. Save or unzip this project somewhere easy to find, such as `Downloads` or `Documents`.
2. Open `File Explorer`.
3. Open the project folder.

### 3. Open Command Prompt
1. Press the `Windows` key.
2. Type `Command Prompt`.
3. Press `Enter`.

### 4. Move into the project folder
Type `cd ` in Command Prompt, then drag the project folder into the Command Prompt window, then press `Enter`.

Example:

```bat
cd "C:\Users\YourName\Downloads\Convert Iphone images to JPJ Format"
```

### 5. Install the app dependencies
Paste this command and press `Enter`:

```bat
npm run install:all
```

Wait until it finishes.

### 6. Start the app
Paste this command and press `Enter`:

```bat
npm run dev
```

You should see messages for:
- backend on port `4000`
- frontend on port `5173`

### 7. Open the app
Open your browser and go to:

```text
http://localhost:5173
```

## How To Use The App
1. Enter the source folder path.
2. Enter the destination folder path.
3. Adjust settings if needed.
4. Click `Scan Images`.
5. Review the scan breakdown and file list.
6. Select or clear files as needed.
7. Click `Start Conversion`.
8. Watch progress in the job card.
9. If the app finds an exact duplicate, choose how to handle it.
10. Review the final summary when the job is done.

The app now includes an in-app About / Getting Started section so new users can understand the flow without leaving the page.

## Folder Path Examples
macOS:

```text
/Users/yourname/Pictures/iPhone Photos
/Volumes/ExternalDrive/Family Photos
```

Windows:

```text
C:\Users\YourName\Pictures\iPhone Photos
D:\Family Photos
```

## Main Settings
### JPEG Quality
- Used when converting non-JPG files into JPG
- Range: `60` to `100`

### Duplicate Handling
- `Ask every time`
- `Skip all exact duplicates`
- `Keep all exact duplicates with suffix`

### Performance Mode
- `Quiet`: lower laptop load
- `Balanced`: default
- `Fast`: higher machine usage for faster throughput

### Include Subfolders
- Scans folders inside the source folder too

### Delete Original After Successful Conversion
- Deletes the source file only after the output file was written safely

### Keep Original
- Overrides delete behavior and preserves the source file

## Phone Access
You can open the app on your phone if:
- the app is already running on your computer
- your phone and computer are on the same Wi-Fi network

Open:

```text
http://<your-computer-ip>:5173
```

Important:
- the phone and laptop are separate clients
- job progress is shared because it comes from backend memory
- scan previews are local to the browser tab that ran the scan

## How Conversion Works
- Conversion runs locally on your machine
- `sharp` is used for most image work
- `heic-convert` is used as a fallback when needed
- duplicate detection is hash-based
- JPG and JPEG inputs are copied instead of re-encoded

## Troubleshooting
### The app says no supported images were found
- Check that the folder contains supported image formats
- Make sure the path is correct
- Turn on `Include subfolders` if your images are inside nested folders

### The app cannot access a folder
- Check that the path still exists
- On macOS, external drives usually appear under `/Volumes/...`
- On Windows, double-check the drive letter, such as `D:\`

### The browser opens but the app is not working
- Make sure `npm run dev` is still running
- Check that port `5173` is available
- Check that the backend is also running on port `4000`

### My phone cannot connect
- Make sure the phone and computer are on the same Wi-Fi network
- Use your computer's local IP address instead of `localhost`
- Allow local network access in your firewall if prompted

## Build Check
To verify the frontend and backend both compile:

```bash
npm run build
```

## Current Limitations
- There is no packaged installer yet
- Job history is stored in backend memory and is lost if the backend restarts
- Scan previews are not synced across devices
- Folder access only works on the machine where the backend is running

## Project Structure
- `frontend/` - React + Vite frontend
- `backend/` - Express + TypeScript backend
- `dev.mjs` - cross-platform root dev launcher
- `dev.sh` - shell-based launcher kept for local convenience
- `HEIC_TO_JPG_APP_ARCHITECTURE.md` - technical architecture notes
- `CHANGELOG.md` - meaningful release notes
- `CONTRIBUTING.md` - maintenance checklist

## Documentation Maintenance
When behavior changes, keep these files in sync:
- `README.md`
- `HEIC_TO_JPG_APP_ARCHITECTURE.md`
- `CHANGELOG.md`
- `CONTRIBUTING.md` when the maintenance process changes
