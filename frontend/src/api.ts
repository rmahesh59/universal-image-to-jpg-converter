import type { BatchProgress, ConversionSettings, FileItem } from "./types";

const API = "http://" + window.location.hostname + ":4000/api";

export interface ScanBreakdownItem {
  extension: string;
  count: number;
  supported: boolean;
}

export interface ScanResponse {
  total: number;
  files: FileItem[];
  resolvedSourcePath: string;
  totalFilesSeen: number;
  supportedFiles: number;
  ignoredFiles: number;
  breakdown: ScanBreakdownItem[];
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(API + url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.ok === false) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export async function scanSource(sourcePath: string, includeSubfolders: boolean) {
  return request<ScanResponse>("/scan", {
    method: "POST",
    body: JSON.stringify({ sourcePath, includeSubfolders }),
  });
}

export async function startJob(
  sourcePath: string,
  destinationPath: string,
  settings: ConversionSettings,
  files: FileItem[]
) {
  return request<{ jobId: string; message: string }>("/jobs", {
    method: "POST",
    body: JSON.stringify({ sourcePath, destinationPath, settings, files }),
  });
}

export async function getJobs() {
  return request<BatchProgress[]>("/jobs");
}

export async function getJobProgress(jobId: string) {
  return request<BatchProgress>("/jobs/" + jobId);
}

export async function cancelJob(jobId: string) {
  return request<{ message: string }>("/jobs/" + jobId + "/cancel", { method: "POST" });
}

export async function retryFailedJob(jobId: string) {
  return request<{ jobId: string; message: string }>("/jobs/" + jobId + "/retry-failed", {
    method: "POST",
  });
}

export async function submitDuplicateDecision(
  jobId: string,
  action: "skip" | "keep" | "skip_all" | "keep_all"
) {
  return request<{ message: string }>("/jobs/" + jobId + "/duplicate", {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}
