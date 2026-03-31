import { useState } from "react";
import type { BatchProgress } from "../types";
import { SummaryCards } from "./SummaryCards";
import { ProgressPanel } from "./ProgressPanel";
import { FileTable } from "./FileTable";
import { FinalSummary } from "./FinalSummary";

export function JobCard({
  job,
  onCancel,
  onOpenOutput,
  onRetryFailed,
}: {
  job: BatchProgress;
  onCancel: () => void;
  onOpenOutput: () => void;
  onRetryFailed: () => void;
}) {
  const [expanded, setExpanded] = useState(job.status === "running" || job.status === "idle");
  const statusClass =
    job.status === "running"
      ? "status-running"
      : job.status === "failed"
        ? "status-failed"
        : "status-complete";

  const summary = {
    total: job.total,
    completed: job.completed,
    pending: job.pending,
    failed: job.failed,
    duplicates: job.duplicateCount,
  };

  return (
    <div className={`card job-card ${expanded ? "expanded" : ""}`}>
      <div
        className={`job-header ${expanded ? "expanded" : ""}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h3 className="job-title">
            Job: {job.sourcePath.split("/").pop() || job.sourcePath}
          </h3>
          <span className="job-meta">
            {new Date(job.startedAt).toLocaleString()} • Status:{" "}
            <strong className={statusClass}>{job.status.toUpperCase()}</strong>
          </span>
        </div>
        <div className="header-actions">
          {job.status === "running" && (
            <button
              className="cancel-button"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            >
              Cancel
            </button>
          )}
          <span className="expand-indicator">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="job-body">
          <SummaryCards {...summary} />
          <ProgressPanel
            total={summary.total}
            completed={summary.completed}
            currentFile={job.currentFile}
            status={job.status}
          />
          <FileTable files={job.fileItems} title="Job Files" />
          <FinalSummary
            progress={job}
            onOpenOutput={onOpenOutput}
            onRetryFailed={onRetryFailed}
          />
        </div>
      )}
    </div>
  );
}
