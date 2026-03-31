interface ProgressPanelProps {
  total: number;
  completed: number;
  currentFile?: string;
  status: string;
}

export function ProgressPanel({ total, completed, currentFile, status }: ProgressPanelProps) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="card">
      <h3>Progress</h3>
      <div className="progress-wrap">
        <div className="progress-bar" style={{ width: `${pct}%` }} />
      </div>
      <div className="meta-row">
        <span>{pct}%</span>
        <span>Status: {status}</span>
      </div>
      <div className="current-file">Current file: {currentFile ?? "-"}</div>
    </div>
  );
}
