import { Router } from "express";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { jobCoordinator } from "./services/batchManager";
import { ConversionSettings, ScanRequest, FileItem } from "./types";
import { scanHeicFiles } from "./services/scannerService";

export const router = Router();

router.post("/scan", async (req, res) => {
  const body = req.body as ScanRequest;
  if (body?.sourcePath === undefined || body.sourcePath === "") {
    res.status(400).json({ message: "sourcePath is required" });
    return;
  }
  let sourcePath = body.sourcePath.trim();
  if (sourcePath.startsWith("~/")) {
    sourcePath = path.join(os.homedir(), sourcePath.slice(2));
  } else if (sourcePath === "~") {
    sourcePath = os.homedir();
  }
  try {
    const stat = await fs.stat(sourcePath);
    if (stat.isDirectory() === false) {
      res.status(400).json({ message: "sourcePath must be a directory" });
      return;
    }
    const result = await scanHeicFiles(sourcePath, Boolean(body.includeSubfolders));
    res.json({ ...result, total: result.files.length, resolvedSourcePath: sourcePath });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Unable to scan source folder",
    });
  }
});

router.post("/jobs", async (req, res) => {
  const { sourcePath, destinationPath, settings, files } = req.body as {
    sourcePath: string;
    destinationPath: string;
    settings: ConversionSettings;
    files: FileItem[];
  };

  if (
    sourcePath === "" ||
    destinationPath === "" ||
    settings === undefined ||
    files === undefined ||
    files.length === 0
  ) {
    res.status(400).json({ message: "sourcePath, destinationPath, config, and files are required" });
    return;
  }

  let src = sourcePath.trim();
  let dst = destinationPath.trim();
  if (dst.startsWith("~/")) dst = path.join(os.homedir(), dst.slice(2));
  else if (dst === "~") dst = os.homedir();

  try {
    const job = jobCoordinator.createJob(src, dst, settings, files);
    job.start().catch((err) => console.error("Job error:", err));
    res.json({ jobId: job.jobId, message: "Job created and running" });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Unable to start job",
    });
  }
});

router.get("/jobs", (_req, res) => {
  res.json(jobCoordinator.getAllJobs());
});

router.get("/jobs/:jobId", (req, res) => {
  const job = jobCoordinator.getJob(req.params.jobId);
  if (job === undefined) {
    res.status(404).json({ message: "Job not found" });
    return;
  }
  res.json(job.getProgress());
});

router.post("/jobs/:jobId/duplicate", (req, res) => {
  const { action } = req.body as { action: "skip" | "keep" | "skip_all" | "keep_all" };
  const job = jobCoordinator.getJob(req.params.jobId);
  if (job === undefined) {
    res.status(404).json({ message: "Job not found" });
    return;
  }

  const fileId = job.getProgress().waitingDuplicate?.fileId;
  if (fileId === undefined || action === undefined) {
    res.status(400).json({ message: "No active duplicate prompt" });
    return;
  }

  const ok = job.submitDuplicateDecision(fileId, action);
  if (ok === false) {
    res.status(404).json({ message: "Decision failed" });
    return;
  }
  res.json({ message: "Decision applied" });
});

router.post("/jobs/:jobId/cancel", (req, res) => {
  const job = jobCoordinator.getJob(req.params.jobId);
  if (job === undefined) {
    res.status(404).json({ message: "Job not found" });
    return;
  }
  job.cancel();
  res.json({ message: "Job cancelled" });
});

router.post("/jobs/:jobId/retry-failed", (req, res) => {
  try {
    const job = jobCoordinator.retryFailedFiles(req.params.jobId);
    job.start().catch((err) => console.error("Retry job error:", err));
    res.json({ jobId: job.jobId, message: "Retry job created and running" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to retry failed files";
    res.status(message === "Job not found" ? 404 : 400).json({ message });
  }
});
