interface FolderPickerProps {
  label: string;
  value: string;
  onChange: (path: string) => void;
  recentPaths?: string[];
}

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<{ name: string }>;
  }
}

export function FolderPicker({ label, value, onChange, recentPaths = [] }: FolderPickerProps) {
  const pick = async () => {
    if (window.showDirectoryPicker) {
      const handle = await window.showDirectoryPicker();
      const path = prompt(
        `Selected: ${handle.name}\nPaste the absolute folder path for backend access:`,
        value
      );
      if (path) onChange(path.trim());
      return;
    }
    const path = prompt("Paste absolute folder path:", value);
    if (path) onChange(path.trim());
  };

  return (
    <div className="card">
      <label className="label">{label}</label>
      <div className="picker-row">
        <input
          className="text-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/Users/mahesh/Downloads/Photos"
        />
        <button type="button" onClick={pick}>
          Choose
        </button>
      </div>
      {recentPaths.length > 0 && (
        <div className="recent-paths">
          <div className="recent-paths-label">Recent</div>
          <div className="recent-paths-list">
            {recentPaths.map((path) => (
              <button
                key={path}
                type="button"
                className="recent-path-chip"
                onClick={() => onChange(path)}
                title={path}
              >
                {path}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
