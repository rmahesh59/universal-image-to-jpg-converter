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
    <div className="card">
      <h3>Settings</h3>
      <div className="settings-grid settings-grid-basic">
        <label>
          JPEG Quality ({settings.jpegQuality})
          <input
            type="range"
            min={60}
            max={100}
            value={settings.jpegQuality}
            onChange={(e) => set("jpegQuality", Number(e.target.value))}
          />
        </label>

        <label>
          Duplicate Handling
          <select
            value={settings.duplicateMode}
            onChange={(e) => set("duplicateMode", e.target.value as ConversionSettings["duplicateMode"])}
          >
            <option value="ask">Ask every time</option>
            <option value="skip_all">Skip all exact duplicates</option>
            <option value="keep_all">Keep all exact duplicates with suffix</option>
          </select>
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
