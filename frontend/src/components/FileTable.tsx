import { useMemo, useState } from "react";
import type { FileItem } from "../types";

interface FileTableProps {
  files: FileItem[];
  title?: string;
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (fileId: string) => void;
}

export function FileTable({
  files,
  title = "Files",
  selectable = false,
  selectedIds = [],
  onToggleSelect,
}: FileTableProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const selectedSet = new Set(selectedIds);
  const availableStatuses = Array.from(new Set(files.map((file) => file.status))).sort();
  const filteredFiles = useMemo(
    () =>
      files.filter((file) => {
        const matchesQuery =
          query.trim() === "" ||
          [
            file.relativePath,
            file.originalName,
            file.outputFileName ?? "",
            file.error ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(query.trim().toLowerCase());
        const matchesStatus = statusFilter === "all" || file.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [files, query, statusFilter]
  );

  return (
    <div className="card table-card">
      <div className="table-header">
        <h3>{title}</h3>
        <div className="table-tools">
          <input
            className="text-input table-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files, output, or error"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {availableStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            {selectable && <th>Select</th>}
            <th>Source</th>
            <th>Status</th>
            <th>Hash</th>
            <th>Output</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {filteredFiles.map((f) => (
            <tr key={f.id}>
              {selectable && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedSet.has(f.id)}
                    onChange={() => onToggleSelect?.(f.id)}
                    aria-label={`Select ${f.relativePath}`}
                  />
                </td>
              )}
              <td>{f.relativePath}</td>
              <td>{f.status}</td>
              <td>{f.hash?.slice(0, 24) ?? "-"}</td>
              <td>{f.outputFileName ?? "-"}</td>
              <td>{f.error ?? "-"}</td>
            </tr>
          ))}
          {filteredFiles.length === 0 && (
            <tr>
              <td colSpan={selectable ? 6 : 5} className="table-empty">
                No files match the current search or status filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
