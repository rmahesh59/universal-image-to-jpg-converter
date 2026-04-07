import type { BatchProgress } from "../types";

export function FinalSummary({
  progress,
  onOpenOutput,
  onRetryFailed,
}: {
  progress?: BatchProgress;
  onOpenOutput?: () => void;
  onRetryFailed?: () => void;
}) {
  if (!progress || !["completed", "cancelled", "failed"].includes(progress.status)) {
    return null;
  }

  const startedAt = new Date(progress.startedAt);
  const finishedAt = progress.finishedAt ? new Date(progress.finishedAt) : undefined;
  const durationMs = finishedAt ? Math.max(0, finishedAt.getTime() - startedAt.getTime()) : 0;
  const durationText =
    durationMs > 0
      ? `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`
      : "-";
  const successRate = progress.total === 0 ? 0 : Math.round((progress.completed / progress.total) * 100);
  const reviewCount = progress.duplicateCount;
  const untouchedCount = Math.max(0, progress.total - progress.completed - progress.failed - progress.skippedDuplicates);
  const processedCount =
    progress.completed + progress.failed + progress.skippedDuplicates;
  const avgPerFileMs = processedCount > 0 ? Math.round(durationMs / processedCount) : 0;
  const filesPerMinute =
    durationMs > 0 ? ((progress.completed / durationMs) * 60000).toFixed(1) : "0.0";
  const metrics = progress.metrics;
  const detailedMetrics = [
    `Images hashed: ${metrics.hashedCount}`,
    `JPG copied: ${metrics.copiedJpgCount}`,
    `HEIC/other converted: ${metrics.convertedImageCount}`,
    `Total hash time: ${Math.round(metrics.totalHashMs)} ms`,
    `Total convert time: ${Math.round(metrics.totalConvertMs)} ms`,
    `Total write time: ${Math.round(metrics.totalWriteMs)} ms`,
    `Total delete time: ${Math.round(metrics.totalDeleteMs)} ms`,
    `Duplicate wait time: ${Math.round(metrics.totalDuplicateWaitMs)} ms`,
    `Queue concurrency: ${metrics.queueConcurrency}`,
    `Performance mode: ${metrics.performanceMode}`,
    `Finished at: ${progress.finishedAt ?? "-"}`,
  ];

  return (
    <div className="card final-summary">
      <h3>Final Summary</h3>
      <div className="summary-highlight-grid">
        <div className="summary-highlight">
          <span>Status</span>
          <strong>{progress.status}</strong>
        </div>
        <div className="summary-highlight">
          <span>Success Rate</span>
          <strong>{successRate}%</strong>
        </div>
        <div className="summary-highlight">
          <span>Duration</span>
          <strong>{durationText}</strong>
        </div>
      </div>
      <div className="summary-detail-grid">
        <p>Total files: {progress.total}</p>
        <p>Converted: {progress.completed}</p>
        <p>Failed: {progress.failed}</p>
        <p>Skipped duplicates: {progress.skippedDuplicates}</p>
        <p>Duplicate reviews raised: {reviewCount}</p>
        <p>Left unfinished: {untouchedCount}</p>
        <p>Average time per file: {avgPerFileMs} ms</p>
        <p>Files per minute: {filesPerMinute}</p>
        <p>Destination: {progress.destinationPath}</p>
      </div>
      <details className="summary-details">
        <summary>Show detailed performance metrics</summary>
        <div className="summary-detail-grid summary-detail-grid-compact">
          {detailedMetrics.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </details>
      <div className="summary-actions">
        <button type="button" onClick={onOpenOutput}>
          Open Output Folder
        </button>
        {progress.failed > 0 && (
          <button type="button" className="primary" onClick={onRetryFailed}>
            Retry Failed Files
          </button>
        )}
      </div>
    </div>
  );
}
