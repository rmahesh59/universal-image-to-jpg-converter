import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import "./App.css";
import {
  cancelJob,
  getJobs,
  retryFailedJob,
  scanSource,
  startJob,
  submitDuplicateDecision,
  type ScanBreakdownItem,
} from "./api";
import { FolderPicker } from "./components/FolderPicker";
import { SettingsPanel } from "./components/SettingsPanel";
import { DuplicateReviewModal } from "./components/DuplicateReviewModal";
import { JobCard } from "./components/JobCard";
import { FileTable } from "./components/FileTable";
import { AboutPanel } from "./components/AboutPanel";
import {
  EventCelebration,
  type CelebrationEvent,
} from "./components/EventCelebration";
import type { BatchProgress, ConversionSettings, FileItem } from "./types";

const defaultSettings: ConversionSettings = {
  jpegQuality: 100,
  includeSubfolders: true,
  deleteOriginalAfterSuccess: true,
  keepOriginal: false,
  duplicateMode: "ask",
  performanceMode: "balanced",
};

const RECENT_SOURCE_PATHS_KEY = "recent-source-paths";
const RECENT_DESTINATION_PATHS_KEY = "recent-destination-paths";
const RECENT_PATH_PAIRS_KEY = "recent-path-pairs";
const SETTINGS_STORAGE_KEY = "conversion-settings";
const JOB_CACHE_KEY = "cached-job-history";
const MAX_RECENT_PATHS = 10;
const MAX_RECENT_PAIRS = 8;

interface RecentPathPair {
  sourcePath: string;
  destinationPath: string;
}

interface ScanSummary {
  totalFilesSeen: number;
  supportedFiles: number;
  ignoredFiles: number;
  breakdown: ScanBreakdownItem[];
}

function loadRecentPaths(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === "") return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function loadRecentPairs(): RecentPathPair[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_PATH_PAIRS_KEY);
    if (raw === null || raw === "") return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (value): value is RecentPathPair =>
        typeof value?.sourcePath === "string" && typeof value?.destinationPath === "string"
    );
  } catch {
    return [];
  }
}

function loadSettings(): ConversionSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw === null || raw == "") return defaultSettings;
    return { ...defaultSettings, ...(JSON.parse(raw) as Partial<ConversionSettings>) };
  } catch {
    return defaultSettings;
  }
}

function loadCachedJobs(): BatchProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(JOB_CACHE_KEY);
    if (raw === null || raw === "") return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BatchProgress[]) : [];
  } catch {
    return [];
  }
}

function App() {
  const [sourcePath, setSourcePath] = useState("");
  const [destinationPath, setDestinationPath] = useState("");
  const [recentSourcePaths, setRecentSourcePaths] = useState<string[]>(() =>
    loadRecentPaths(RECENT_SOURCE_PATHS_KEY)
  );
  const [recentDestinationPaths, setRecentDestinationPaths] = useState<string[]>(() =>
    loadRecentPaths(RECENT_DESTINATION_PATHS_KEY)
  );
  const [recentPathPairs, setRecentPathPairs] = useState<RecentPathPair[]>(() =>
    loadRecentPairs()
  );
  const [settings, setSettings] = useState<ConversionSettings>(() => loadSettings());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [scannedFiles, setScannedFiles] = useState<FileItem[]>([]);
  const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null);
  const [selectedScanIds, setSelectedScanIds] = useState<string[]>([]);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanned">("idle");

  const [jobs, setJobs] = useState<BatchProgress[]>(() => loadCachedJobs());
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [celebrations, setCelebrations] = useState<CelebrationEvent[]>([]);
  const jobsBootstrappedRef = useRef(false);
  const previousJobsRef = useRef<
    Map<string, { status: BatchProgress["status"]; waitingDuplicateFileId?: string }>
  >(new Map());

  const queueCelebration = (event: Omit<CelebrationEvent, "id">) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setCelebrations((current) => [...current, { ...event, id }].slice(-4));
    window.setTimeout(() => {
      setCelebrations((current) => current.filter((item) => item.id !== id));
    }, 5200);
  };

  const jobLabel = (job: Pick<BatchProgress, "sourcePath"> | { sourcePath: string }) =>
    job.sourcePath.split("/").pop() || job.sourcePath;

  const rememberPath = (
    key: string,
    value: string,
    update: Dispatch<SetStateAction<string[]>>
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    update((current) => {
      const next = [trimmed, ...current.filter((item) => item !== trimmed)].slice(0, MAX_RECENT_PATHS);
      window.localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  const rememberPathPair = (source: string, destination: string) => {
    const sourceTrimmed = source.trim();
    const destinationTrimmed = destination.trim();
    if (!sourceTrimmed || !destinationTrimmed) return;
    setRecentPathPairs((current) => {
      const next = [
        { sourcePath: sourceTrimmed, destinationPath: destinationTrimmed },
        ...current.filter(
          (pair) =>
            pair.sourcePath !== sourceTrimmed || pair.destinationPath !== destinationTrimmed
        ),
      ].slice(0, MAX_RECENT_PAIRS);
      window.localStorage.setItem(RECENT_PATH_PAIRS_KEY, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    let mounted = true;

    const refreshJobs = async () => {
      try {
        const fetchedJobs = await getJobs();
        if (mounted === false) return;
        setJobs(fetchedJobs);
      } catch {
        // Keep cached jobs visible if polling fails.
      }
    };

    void refreshJobs();

    const timer = setInterval(async () => {
      await refreshJobs();
    }, 1200);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    window.localStorage.setItem(JOB_CACHE_KEY, JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    if (jobsBootstrappedRef.current === false) {
      previousJobsRef.current = new Map(
        jobs.map((job) => [
          job.batchId,
          { status: job.status, waitingDuplicateFileId: job.waitingDuplicate?.fileId },
        ])
      );
      jobsBootstrappedRef.current = true;
      return;
    }

    const previous = previousJobsRef.current;

    jobs.forEach((job) => {
      const last = previous.get(job.batchId);

      if (last && last.status === "running" && job.status === "completed") {
        queueCelebration({
          kind: "success",
          title: `${jobLabel(job)} finished beautifully`,
          message: `Completed successfully. ${job.completed} of ${job.total} files are ready in the destination folder.`,
        });
      }

      if (job.waitingDuplicate && last?.waitingDuplicateFileId !== job.waitingDuplicate.fileId) {
        queueCelebration({
          kind: "duplicate",
          title: `Duplicate review needed in ${jobLabel(job)}`,
          message: `${job.waitingDuplicate.incomingName} matches an existing image. Pick whether to skip or keep both.`,
        });
      }
    });

    previousJobsRef.current = new Map(
      jobs.map((job) => [
        job.batchId,
        { status: job.status, waitingDuplicateFileId: job.waitingDuplicate?.fileId },
      ])
    );
  }, [jobs]);

  const onScan = async () => {
    setError("");
    if (sourcePath === "") {
      setError("Please select a source folder path.");
      return;
    }
    setBusy(true);
    try {
      const result = await scanSource(sourcePath, settings.includeSubfolders);
      rememberPath(RECENT_SOURCE_PATHS_KEY, sourcePath, setRecentSourcePaths);
      setScannedFiles(result.files);
      setScanSummary({
        totalFilesSeen: result.totalFilesSeen,
        supportedFiles: result.supportedFiles,
        ignoredFiles: result.ignoredFiles,
        breakdown: result.breakdown,
      });
      setSelectedScanIds(result.files.map((file) => file.id));
      if (result.files.length === 0) {
        setError("No supported images found in that folder.");
      }
      setScanStatus("scanned");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
      setScanStatus("idle");
      setScanSummary(null);
    } finally {
      setBusy(false);
    }
  };

  const onSourcePathChange = (nextPath: string) => {
    setSourcePath(nextPath);
    setScanStatus("idle");
    setScannedFiles([]);
    setScanSummary(null);
    setSelectedScanIds([]);
  };

  const onDestinationPathChange = (nextPath: string) => {
    setDestinationPath(nextPath);
  };

  const toggleScanSelection = (fileId: string) => {
    setSelectedScanIds((current) =>
      current.includes(fileId)
        ? current.filter((id) => id !== fileId)
        : [...current, fileId]
    );
  };

  const selectedFiles = scannedFiles.filter((file) => selectedScanIds.includes(file.id));

  const onConvert = async () => {
    setError("");
    if (sourcePath === "" || destinationPath === "") {
      setError("Please choose both source and destination folders.");
      return;
    }
    if (selectedFiles.length === 0) {
      setError("Select at least one scanned file before starting conversion.");
      return;
    }

    setBusy(true);
    try {
      await startJob(sourcePath, destinationPath, settings, selectedFiles);
      rememberPath(RECENT_SOURCE_PATHS_KEY, sourcePath, setRecentSourcePaths);
      rememberPath(RECENT_DESTINATION_PATHS_KEY, destinationPath, setRecentDestinationPaths);
      rememberPathPair(sourcePath, destinationPath);
      queueCelebration({
        kind: "start",
        title: `${jobLabel({ sourcePath })} is on the move`,
        message: `Your conversion job just started with ${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"}.`,
      });
      setSourcePath("");
      setDestinationPath("");
      setScannedFiles([]);
      setScanSummary(null);
      setSelectedScanIds([]);
      setScanStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed to start");
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicateDecision = async (
    jobId: string,
    action: "skip" | "keep" | "skip_all" | "keep_all"
  ) => {
    setDecisionSubmitting(true);
    try {
      await submitDuplicateDecision(jobId, action);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Duplicate decision failed");
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const openOutputFolder = (folderPath: string) => {
    const trimmed = folderPath.trim();
    if (trimmed === "") return;
    window.prompt("Open this folder on your laptop:", trimmed);
  };

  const handleRetryFailed = async (job: BatchProgress) => {
    try {
      const result = await retryFailedJob(job.batchId);
      queueCelebration({
        kind: "start",
        title: `Retry started for ${jobLabel(job)}`,
        message: `A new retry job was created for the failed files. New job id: ${result.jobId}.`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to retry failed files");
    }
  };

  const activeJobWithPrompt = jobs.find((j) => Boolean(j.waitingDuplicate));
  const completedJobs = jobs.filter((job) => job.status === "completed").length;
  const runningJobs = jobs.filter((job) => job.status === "running").length;
  const duplicateWaitingJobs = jobs.filter((job) => Boolean(job.waitingDuplicate)).length;
  const jpgInputs = scannedFiles.filter((file) => /\.(jpe?g)$/i.test(file.originalName)).length;
  const nonJpgInputs = scannedFiles.length - jpgInputs;
  const topBreakdown = scanSummary?.breakdown.slice(0, 8) ?? [];
  const showAboutPanel = jobs.length === 0 && scanStatus === "idle";

  return (
    <div className="app-shell">
      <div className="ambient-orb ambient-orb-left" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-right" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-bottom" aria-hidden="true" />
      <EventCelebration
        events={[...celebrations].reverse()}
        onDismiss={(id) =>
          setCelebrations((current) => current.filter((event) => event.id !== id))
        }
      />
      <header>
        <div className="eyebrow-row">
          <span className="eyebrow-pill">Local Network Ready</span>
          <span className="eyebrow-divider" aria-hidden="true" />
          <span className="eyebrow-note">
            Convert iPhone photos and common image formats into clean JPG batches
          </span>
        </div>
        <h1>Universal Image to JPG Converter</h1>
        <p>
          Convert HEIC, PNG, WEBP, and more into clean JPG batches with local processing,
          duplicate safety, and live progress.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <span>Running</span>
            <strong>{runningJobs}</strong>
          </div>
          <div className="hero-stat">
            <span>Completed</span>
            <strong>{completedJobs}</strong>
          </div>
          <div className="hero-stat">
            <span>Needs Review</span>
            <strong>{duplicateWaitingJobs}</strong>
          </div>
        </div>
        <div className="hero-steps">
          <span>1. Choose folders</span>
          <span>2. Scan and review</span>
          <span>3. Start conversion</span>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {recentPathPairs.length > 0 && (
        <div className="pair-strip card">
          <div className="pair-strip-header">
            <h3>Recent Folder Pairs</h3>
            <p>Reuse your last source and destination combinations in one click.</p>
          </div>
          <div className="pair-chip-row">
            {recentPathPairs.map((pair) => (
              <button
                key={`${pair.sourcePath}__${pair.destinationPath}`}
                type="button"
                className="pair-chip"
                onClick={() => {
                  onSourcePathChange(pair.sourcePath);
                  onDestinationPathChange(pair.destinationPath);
                }}
                title={`${pair.sourcePath} -> ${pair.destinationPath}`}
              >
                <span>{pair.sourcePath}</span>
                <strong>{pair.destinationPath}</strong>
              </button>
            ))}
          </div>
        </div>
      )}

      {showAboutPanel && <AboutPanel />}

      <div className="card hero-card">
        <div className="hero-topbar">
          <h3 className="hero-title">Create New Job</h3>
          {jobs.length > 0 && (
            <span className="parallel-badge">
              ⚡ Parallel Mode Active: You can start another job right now!
            </span>
          )}
        </div>
        <div className="layout-grid">
          <FolderPicker
            label="Source Folder"
            value={sourcePath}
            onChange={onSourcePathChange}
            recentPaths={recentSourcePaths}
          />
          <FolderPicker
            label="Destination Folder"
            value={destinationPath}
            onChange={onDestinationPathChange}
            recentPaths={recentDestinationPaths}
          />
        </div>

        <SettingsPanel settings={settings} onChange={setSettings} />

        <div className="actions">
          <button disabled={busy} onClick={onScan}>
            Scan Images
          </button>
          <button
            className="primary"
            disabled={busy || selectedFiles.length === 0 || scanStatus === "idle"}
            onClick={onConvert}
          >
            Start Conversion ({selectedFiles.length} files)
          </button>
        </div>

        {scanStatus === "scanned" && scanSummary && (
          <div className="scan-preview">
            <div className="scan-preview-header">
              <div>
                <h4 className="section-title">Folder Scan Breakdown</h4>
                <p className="scan-preview-subtitle">
                  Supported image files are ready for conversion. Other file types are counted but ignored.
                </p>
              </div>
            </div>
            <div className="scan-insights">
              <div className="scan-insight-card">
                <span>Total Files Seen</span>
                <strong>{scanSummary.totalFilesSeen}</strong>
              </div>
              <div className="scan-insight-card">
                <span>Supported Images</span>
                <strong>{scanSummary.supportedFiles}</strong>
              </div>
              <div className="scan-insight-card">
                <span>Ignored Files</span>
                <strong>{scanSummary.ignoredFiles}</strong>
              </div>
              <div className="scan-insight-card">
                <span>Selected</span>
                <strong>{selectedFiles.length}</strong>
              </div>
              <div className="scan-insight-card">
                <span>Already JPG/JPEG</span>
                <strong>{jpgInputs}</strong>
              </div>
              <div className="scan-insight-card">
                <span>Needs Conversion</span>
                <strong>{nonJpgInputs}</strong>
              </div>
            </div>
            {topBreakdown.length > 0 && (
              <div className="breakdown-strip">
                {topBreakdown.map((item) => (
                  <div key={item.extension} className={`breakdown-chip ${item.supported ? "supported" : "ignored"}`}>
                    <span>{item.extension}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {scanStatus === "scanned" && scannedFiles.length > 0 && (
          <div className="scan-preview">
            <div className="scan-preview-header">
              <div>
                <h4 className="section-title">Scanned Files Preview</h4>
                <p className="scan-preview-subtitle">
                  Select the exact supported image files you want in this batch before you start.
                </p>
              </div>
              <div className="scan-selection-actions">
                <button
                  type="button"
                  onClick={() => setSelectedScanIds(scannedFiles.map((file) => file.id))}
                >
                  Select All
                </button>
                <button type="button" onClick={() => setSelectedScanIds([])}>
                  Clear All
                </button>
              </div>
            </div>
            <div className="scan-preview-window">
              <FileTable
                files={scannedFiles}
                title="Scanned Files"
                selectable
                selectedIds={selectedScanIds}
                onToggleSelect={toggleScanSelection}
              />
            </div>
          </div>
        )}
      </div>

      <div className="jobs-container">
        {jobs.length > 0 && <h2 className="jobs-heading">Active & Past Jobs</h2>}
        {jobs.length === 0 && (
          <div className="idle-showcase card">
            <div className="idle-copy">
              <div className="idle-badge">Ready When You Are</div>
              <h2>Your conversion stage is set</h2>
              <p>
                Drop in a source folder, scan the images, and launch a polished batch
                workflow with duplicate detection, previews, progress tracking, and remembered settings.
              </p>
              <div className="idle-points">
                <span>Local processing</span>
                <span>Duplicate-safe output</span>
                <span>Recent folders remembered</span>
              </div>
            </div>
            <div className="idle-visual" aria-hidden="true">
              <div className="pulse-ring pulse-ring-a" />
              <div className="pulse-ring pulse-ring-b" />
              <div className="pulse-ring pulse-ring-c" />
              <div className="core-disc">
                <span>Scan</span>
                <span>Select</span>
                <span>Convert</span>
              </div>
            </div>
          </div>
        )}
        {jobs.map((job) => (
          <JobCard
            key={job.batchId}
            job={job}
            onCancel={() => cancelJob(job.batchId)}
            onOpenOutput={() => openOutputFolder(job.destinationPath)}
            onRetryFailed={() => handleRetryFailed(job)}
          />
        ))}
      </div>

      {activeJobWithPrompt && (
        <DuplicateReviewModal
          prompt={activeJobWithPrompt.waitingDuplicate}
          isSubmitting={decisionSubmitting}
          onDecision={(action) => handleDuplicateDecision(activeJobWithPrompt.batchId, action)}
        />
      )}
    </div>
  );
}

export default App;
