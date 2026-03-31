export type DuplicateMode = "ask" | "skip_all" | "keep_all";

export interface ScanRequest {
  sourcePath: string;
  includeSubfolders: boolean;
}

export interface ConversionSettings {
  jpegQuality: number;
  includeSubfolders: boolean;
  deleteOriginalAfterSuccess: boolean;
  keepOriginal: boolean;
  duplicateMode: DuplicateMode;
}

export type FileStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "skipped_duplicate"
  | "duplicate_waiting"
  | "cancelled";

export interface FileItem {
  id: string;
  sourcePath: string;
  relativePath: string;
  originalName: string;
  originalBaseName: string;
  hash?: string;
  outputFileName?: string;
  outputPath?: string;
  status: FileStatus;
  error?: string;
  duplicateOfId?: string;
}

export interface BatchProgress {
  batchId: string;
  sourcePath: string;
  destinationPath: string;
  total: number;
  completed: number;
  failed: number;
  skippedDuplicates: number;
  duplicateCount: number;
  pending: number;
  currentFile?: string;
  status: "idle" | "running" | "completed" | "cancelled" | "failed";
  fileItems: FileItem[];
  waitingDuplicate?: DuplicatePrompt;
  startedAt: string;
  finishedAt?: string;
}

export interface DuplicatePrompt {
  fileId: string;
  existingFileId: string;
  incomingName: string;
  existingName: string;
  incomingPreviewDataUrl?: string;
  existingPreviewDataUrl?: string;
}
