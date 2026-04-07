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
  const isWindows = typeof navigator !== "undefined" && navigator.userAgent.includes("Windows");
  const examplePath = isWindows
    ? "C:\\Users\\YourName\\Pictures\\iPhone Photos"
    : "/Users/yourname/Pictures/iPhone Photos";

  const pick = async () => {
    if (window.showDirectoryPicker) {
      const handle = await window.showDirectoryPicker();
      const path = prompt(
        `Selected: ${handle.name}\nPaste the full folder path so the local backend can reach it:`,
        value
      );
      if (path) onChange(path.trim());
      return;
    }
    const path = prompt("Paste the full folder path:", value);
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
          placeholder={examplePath}
          spellCheck={false}
        />
        <button type="button" onClick={pick}>
          Choose
        </button>
      </div>
      <p className="field-hint">
        Enter the full folder path from your computer. Example: <code>{examplePath}</code>
      </p>
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
