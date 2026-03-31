function sanitizeBaseName(baseName: string): string {
  return baseName
    .normalize("NFKD")
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "image";
}

function timestampString(date: Date): string {
  const yyyy = date.getFullYear().toString();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const sec = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}_${hh}${min}${sec}`;
}

export function buildOutputFileName(params: {
  originalBaseName: string;
  sha256: string;
  date: Date;
  duplicateIndex?: number;
}): string {
  const ts = timestampString(params.date);
  const safeBase = sanitizeBaseName(params.originalBaseName);
  const hashPrefix = params.sha256.slice(0, 24);
  const dup =
    params.duplicateIndex && params.duplicateIndex > 0
      ? `_DUP${params.duplicateIndex}`
      : "";

  return `${ts}_${safeBase}_${hashPrefix}${dup}.jpg`;
}
