import { useState } from "react";
import type { ConversionSettings } from "../types";

interface SettingsPanelProps {
  settings: ConversionSettings;
  onChange: (next: ConversionSettings) => void;
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const set = <K extends keyof ConversionSettings>(key: K, value: ConversionSettings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <div className="card settings-card">
      <div className="settings-header">
        <div>
          <h3>Settings</h3>
          <p>Keep the defaults for the simplest experience, or adjust them for this batch.</p>
        </div>
        <div className="settings-mode-chip">Mode: {settings.performanceMode}</div>
      </div>
      <div className="settings-grid settings-grid-basic">
        <label className="setting-field">
          <span className="setting-label">JPEG Quality</span>
          <span className="setting-value">{settings.jpegQuality}</span>
          <input
            type="range"
            min={60}
            max={100}
            value={settings.jpegQuality}
            onChange={(e) => set("jpegQuality", Number(e.target.value))}
          />
          <small>Higher values keep more detail but create larger files.</small>
        </label>

        <label className="setting-field">
          <span className="setting-label">Duplicate Handling</span>
          <select
            value={settings.duplicateMode}
            onChange={(e) => set("duplicateMode", e.target.value as ConversionSettings["duplicateMode"])}
          >
            <option value="ask">Ask every time</option>
            <option value="skip_all">Skip all exact duplicates</option>
            <option value="keep_all">Keep all exact duplicates with suffix</option>
          </select>
          <small>Use ask mode when you want full control over duplicate decisions.</small>
        </label>

        <label className="setting-field">
          <span className="setting-label">Performance Mode</span>
          <select
            value={settings.performanceMode}
            onChange={(e) => set("performanceMode", e.target.value as ConversionSettings["performanceMode"])}
          >
            <option value="quiet">Quiet (less laptop load)</option>
            <option value="balanced">Balanced</option>
            <option value="fast">Fast (higher machine usage)</option>
          </select>
          <small>Balanced is the best default for most batches.</small>
        </label>
      </div>

      <button
        type="button"
        className="settings-toggle"
        onClick={() => setAdvancedOpen((current) => !current)}
      >
        {advancedOpen ? "Hide Advanced Settings" : "Show Advanced Settings"}
      </button>

      {advancedOpen && (
        <div className="settings-grid settings-grid-advanced">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={settings.includeSubfolders}
              onChange={(e) => set("includeSubfolders", e.target.checked)}
            />
            Include subfolders
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={settings.deleteOriginalAfterSuccess}
              onChange={(e) => set("deleteOriginalAfterSuccess", e.target.checked)}
            />
            Delete original after successful conversion
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={settings.keepOriginal}
              onChange={(e) => set("keepOriginal", e.target.checked)}
            />
            Keep original (overrides delete)
          </label>
        </div>
      )}
    </div>
  );
}
