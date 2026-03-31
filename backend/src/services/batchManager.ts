import fs from "fs/promises";
import path from "path";
import PQueue from "p-queue";
import { buildOutputFileName } from "./fileNameService";
import { convertHeicToJpg, createPreviewDataUrl } from "./converterService";
import { sha256Hex } from "./hashService";
import { BatchProgress, ConversionSettings, DuplicatePrompt, FileItem } from "../types";

interface DuplicateDecision {
  action: "skip" | "keep";
}

export class BatchJob {
  private progress: BatchProgress;
  private shouldCancel = false;
  private hashToFileId = new Map<string, string>();
  private destinationFilesByHashPrefix = new Map<
    string,
    Array<{ fileName: string; filePath: string }>
  >();
  private hashPrefixOccurrenceCount = new Map<string, number>();
  private duplicateResolvers = new Map<string, (decision: DuplicateDecision) => void>();

  constructor(
    public readonly jobId: string,
    private sourcePath: string,
    private destinationPath: string,
    private settings: ConversionSettings,
    private initialFileItems: FileItem[]
  ) {
    this.progress = {
      batchId: jobId,
      sourcePath,
      destinationPath,
      total: initialFileItems.length,
      completed: 0,
      failed: 0,
      skippedDuplicates: 0,
      duplicateCount: 0,
      pending: initialFileItems.length,
      status: "idle",
      fileItems: initialFileItems,
      startedAt: new Date().toISOString(),
    };
  }

  getProgress(): BatchProgress {
    return this.progress;
  }

  getSettings(): ConversionSettings {
    return { ...this.settings };
  }

  cancel(): void {
    this.shouldCancel = true;
  }

  submitDuplicateDecision(fileId: string, action: "skip" | "keep" | "skip_all" | "keep_all"): boolean {
    const resolver = this.duplicateResolvers.get(fileId);
    if (!resolver) return false;
    this.duplicateResolvers.delete(fileId);

    if (action === "skip_all" || action === "keep_all") {
      this.settings.duplicateMode = action;
      resolver({ action: action === "skip_all" ? "skip" : "keep" });
    } else {
      resolver({ action });
    }
    return true;
  }

  async start(): Promise<void> {
    if (this.progress.status === "running") {
      throw new Error("Batch is already running.");
    }

    this.progress.status = "running";
    this.progress.startedAt = new Date().toISOString();

    await this.indexDestinationFiles(this.destinationPath);

    if (this.progress.fileItems.length === 0) {
      this.progress.status = "completed";
      this.progress.finishedAt = new Date().toISOString();
      return;
    }

    void this.processBatch(this.settings);
  }

  private async processBatch(settings: ConversionSettings): Promise<void> {
    try {
      await fs.mkdir(this.progress.destinationPath, { recursive: true });
      const concurrency = settings.duplicateMode === "ask" ? 1 : 4;
      const queue = new PQueue({ concurrency });

      await Promise.all(
        this.progress.fileItems.map((file) =>
          queue.add(async () => {
            await this.processFile(file, settings);
          })
        )
      );

      this.progress.currentFile = undefined;
      this.progress.status = this.shouldCancel ? "cancelled" : "completed";
      this.progress.finishedAt = new Date().toISOString();
    } catch (error) {
      this.progress.status = "failed";
      this.progress.currentFile = undefined;
      this.progress.finishedAt = new Date().toISOString();
      const message = error instanceof Error ? error.message : "Unknown batch error";
      this.progress.fileItems.forEach((f) => {
        if (f.status === "pending" || f.status === "processing") {
          f.status = "failed";
          f.error = message;
        }
      });
      this.recomputeCounts();
    }
  }

  private async processFile(file: FileItem, settings: ConversionSettings): Promise<void> {
    if (this.shouldCancel) {
      file.status = "cancelled";
      this.recomputeCounts();
      return;
    }

    this.progress.currentFile = file.relativePath;
    file.status = "processing";

    let reservedHashKey: string | undefined;

    try {
      const inputBuffer = await fs.readFile(file.sourcePath);
      const sha = sha256Hex(inputBuffer);
      const hashPrefix = sha.slice(0, 24);
      file.hash = sha;

      const existingFileId = this.hashToFileId.get(sha);
      const existingDestination = this.destinationFilesByHashPrefix.get(hashPrefix)?.[0];
      const hasDuplicate = Boolean(existingFileId || existingDestination);

      if (hasDuplicate) {
        this.progress.duplicateCount += 1;
        if (existingFileId) {
          file.duplicateOfId = existingFileId;
        }
        const decision = await this.resolveDuplicate(
          file,
          {
            fileId: existingFileId,
            name: existingFileId
              ? this.progress.fileItems.find((f) => f.id === existingFileId)?.originalName
              : existingDestination?.fileName,
            previewPath: existingFileId
              ? this.progress.fileItems.find((f) => f.id === existingFileId)?.outputPath
              : existingDestination?.filePath,
          },
          inputBuffer,
          settings.duplicateMode
        );

        if (decision.action === "skip") {
          file.status = "skipped_duplicate";
          this.progress.skippedDuplicates += 1;
          this.recomputeCounts();
          return;
        }
      }

      if (!existingFileId) {
        this.hashToFileId.set(sha, file.id);
        reservedHashKey = sha;
      }

      const duplicateIndex = this.hashPrefixOccurrenceCount.get(hashPrefix) ?? 0;
      this.hashPrefixOccurrenceCount.set(hashPrefix, duplicateIndex + 1);

      const outputName = buildOutputFileName({
        originalBaseName: file.originalBaseName,
        sha256: sha,
        date: new Date(),
        duplicateIndex,
      });
      const outputPath = path.join(this.progress.destinationPath, outputName);
      const ext = path.extname(file.originalName).toLowerCase();

      if (ext === ".jpg" || ext === ".jpeg") {
        await fs.copyFile(file.sourcePath, outputPath);
      } else {
        const jpgBuffer = await convertHeicToJpg(inputBuffer, settings.jpegQuality);
        await fs.writeFile(outputPath, jpgBuffer);
      }

      const stat = await fs.stat(outputPath);
      if (!stat.isFile() || stat.size <= 0) {
        throw new Error("Output file integrity check failed.");
      }

      if (settings.deleteOriginalAfterSuccess && !settings.keepOriginal) {
        await fs.unlink(file.sourcePath);
      }

      file.outputFileName = outputName;
      file.outputPath = outputPath;
      file.status = "completed";

      if (existingFileId) {
        this.hashToFileId.set(`${sha}:${file.id}`, file.id);
      }
    } catch (error) {
      if (reservedHashKey && this.hashToFileId.get(reservedHashKey) === file.id) {
        this.hashToFileId.delete(reservedHashKey);
      }
      file.status = "failed";
      file.error = error instanceof Error ? error.message : "Unknown error";
      this.progress.failed += 1;
    } finally {
      this.recomputeCounts();
    }
  }

  private async resolveDuplicate(
    file: FileItem,
    existing: { fileId?: string; name?: string; previewPath?: string },
    inputBuffer: Buffer,
    mode: "ask" | "skip_all" | "keep_all"
  ): Promise<DuplicateDecision> {
    if (mode === "skip_all") return { action: "skip" };
    if (mode === "keep_all") return { action: "keep" };

    file.status = "duplicate_waiting";
    const waitingDuplicate: DuplicatePrompt = {
      fileId: file.id,
      existingFileId: existing.fileId ?? "destination-existing",
      incomingName: file.originalName,
      existingName: existing.name ?? "Existing file",
      incomingPreviewDataUrl: await createPreviewDataUrl(inputBuffer),
      existingPreviewDataUrl: existing.previewPath
        ? `data:image/jpeg;base64,${(await fs.readFile(existing.previewPath)).toString(
            "base64"
          )}`
        : undefined,
    };
    this.progress.waitingDuplicate = waitingDuplicate;

    return new Promise<DuplicateDecision>((resolve) => {
      this.duplicateResolvers.set(file.id, (decision) => {
        this.progress.waitingDuplicate = undefined;
        resolve(decision);
      });
    });
  }

  private recomputeCounts(): void {
    const completed = this.progress.fileItems.filter((f) => f.status === "completed").length;
    const pending = this.progress.fileItems.filter((f) =>
      ["pending", "processing", "duplicate_waiting"].includes(f.status)
    ).length;
    const failed = this.progress.fileItems.filter((f) => f.status === "failed").length;
    const skipped = this.progress.fileItems.filter((f) => f.status === "skipped_duplicate").length;
    this.progress.completed = completed;
    this.progress.pending = pending;
    this.progress.failed = failed;
    this.progress.skippedDuplicates = skipped;
  }

  private async indexDestinationFiles(destinationPath: string): Promise<void> {
    await fs.mkdir(destinationPath, { recursive: true });
    const entries = await fs.readdir(destinationPath, { withFileTypes: true });
    const pattern = /_([A-F0-9]{24})(?:_DUP\d+)?\.jpg$/i;

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const match = entry.name.match(pattern);
      if (!match) continue;

      const hashPrefix = match[1].toUpperCase();
      const filePath = path.join(destinationPath, entry.name);
      const list = this.destinationFilesByHashPrefix.get(hashPrefix) ?? [];
      list.push({ fileName: entry.name, filePath });
      this.destinationFilesByHashPrefix.set(hashPrefix, list);
      this.hashPrefixOccurrenceCount.set(hashPrefix, list.length);
    }
  }
}

class JobCoordinator {
  private jobs = new Map<string, BatchJob>();

  createJob(
    sourcePath: string,
    destinationPath: string,
    settings: ConversionSettings,
    initialFileItems: FileItem[]
  ): BatchJob {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const job = new BatchJob(jobId, sourcePath, destinationPath, settings, initialFileItems);
    this.jobs.set(jobId, job);
    return job;
  }

  getJob(jobId: string): BatchJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): BatchProgress[] {
    return Array.from(this.jobs.values()).map(j => j.getProgress()).sort((a,b) => b.startedAt.localeCompare(a.startedAt));
  }

  retryFailedFiles(jobId: string): BatchJob {
    const existing = this.jobs.get(jobId);
    if (!existing) {
      throw new Error("Job not found");
    }

    const progress = existing.getProgress();
    const retryFiles = progress.fileItems
      .filter((file) => file.status === "failed")
      .map((file) => ({
        id: `${file.id}_retry_${Date.now()}`,
        sourcePath: file.sourcePath,
        relativePath: file.relativePath,
        originalName: file.originalName,
        originalBaseName: file.originalBaseName,
        status: "pending" as const,
      }));

    if (retryFiles.length === 0) {
      throw new Error("No failed files available to retry");
    }

    const retryJob = this.createJob(
      progress.sourcePath,
      progress.destinationPath,
      existing.getSettings(),
      retryFiles
    );
    return retryJob;
  }
}

export const jobCoordinator = new JobCoordinator();
