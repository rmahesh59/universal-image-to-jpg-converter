import fs from "fs/promises";
import path from "path";
import { FileItem } from "../types";

const SUPPORTED_EXTS = new Set([
  ".heic", ".heif", ".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".tif"
]);

function shouldIgnoreEntry(name: string): boolean {
  return name.startsWith("._") || name.startsWith(".");
}

export interface ScanBreakdownItem {
  extension: string;
  count: number;
  supported: boolean;
}

export interface ScanResult {
  files: FileItem[];
  totalFilesSeen: number;
  supportedFiles: number;
  ignoredFiles: number;
  breakdown: ScanBreakdownItem[];
}

export async function scanHeicFiles(
  sourcePath: string,
  includeSubfolders: boolean
): Promise<ScanResult> {
  const output: FileItem[] = [];
  const extensionCounts = new Map<string, { count: number; supported: boolean }>();
  let totalFilesSeen = 0;

  const trackExtension = (ext: string, supported: boolean) => {
    const normalized = ext || "[no extension]";
    const current = extensionCounts.get(normalized);
    if (current) {
      current.count += 1;
      return;
    }
    extensionCounts.set(normalized, { count: 1, supported });
  };

  async function walk(currentAbs: string, base: string): Promise<void> {
    const entries = await fs.readdir(currentAbs, { withFileTypes: true });
    for (const entry of entries) {
      if (shouldIgnoreEntry(entry.name)) {
        continue;
      }

      const entryAbs = path.join(currentAbs, entry.name);
      if (entry.isDirectory()) {
        if (includeSubfolders) {
          await walk(entryAbs, base);
        }
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      totalFilesSeen += 1;
      trackExtension(ext, SUPPORTED_EXTS.has(ext));

      if (SUPPORTED_EXTS.has(ext) === false) {
        continue;
      }

      const relativePath = path.relative(base, entryAbs);
      const baseName = path.basename(entry.name, path.extname(entry.name));
      const id = Buffer.from(entryAbs).toString("base64url");

      output.push({
        id,
        sourcePath: entryAbs,
        relativePath,
        originalName: entry.name,
        originalBaseName: baseName,
        status: "pending",
      });
    }
  }

  await walk(sourcePath, sourcePath);
  output.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const breakdown = Array.from(extensionCounts.entries())
    .map(([extension, value]) => ({
      extension,
      count: value.count,
      supported: value.supported,
    }))
    .sort((a, b) => {
      const countDiff = b.count - a.count;
      if (countDiff) return countDiff;
      return a.extension.localeCompare(b.extension);
    });

  return {
    files: output,
    totalFilesSeen,
    supportedFiles: output.length,
    ignoredFiles: Math.max(0, totalFilesSeen - output.length),
    breakdown,
  };
}
