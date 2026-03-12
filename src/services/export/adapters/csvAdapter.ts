/**
 * CSV Export Adapter.
 *
 * Produces a downloadable CSV file with:
 * - First row: column headers
 * - Remaining rows: exported data
 * - Uses RFC 4180 encoding (quoted fields, escaped quotes)
 *
 * Simpler and more lightweight than Excel, works universally.
 */

import type {
  ExportAdapter,
  ExportPayload,
  ExportProgress,
} from '../../../types/export';
import { assertValidPayload } from '../validation';

// ─── Helpers ───────────────────────────────────────────────────────────────

function buildFilename(payload: ExportPayload): string {
  const date = new Date(payload.metadata.timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${payload.config.module}-export-${yyyy}${mm}${dd}-${payload.metadata.exportId}.csv`;
}

/**
 * Escape a CSV field according to RFC 4180.
 * - Wrap in quotes if contains comma, newline, or quote
 * - Double any internal quotes
 */
function escapeCSVField(value: string | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  
  // If contains special chars, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

// ─── CSV Builder ───────────────────────────────────────────────────────────

/**
 * Build CSV content from headers and rows.
 */
function buildCSV(headers: string[], rows: string[][]): string {
  const lines: string[] = [];
  
  // Header row
  lines.push(headers.map(escapeCSVField).join(','));
  
  // Data rows
  for (const row of rows) {
    lines.push(row.map(escapeCSVField).join(','));
  }
  
  return lines.join('\n');
}

// ─── Adapter Implementation ────────────────────────────────────────────────

export const csvAdapter: ExportAdapter = {
  format: 'csv',
  
  async generate(
    payload: ExportPayload,
    onProgress?: (progress: ExportProgress) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    assertValidPayload(payload);
    
    if (signal?.aborted) {
      throw new Error('Export cancelled');
    }
    
    onProgress?.({ percent: 10, message: 'Validating export data…', cancellable: true });
    
    // Extract headers from first row or use empty array
    const headers = payload.rows.length > 0 ? Object.keys(payload.rows[0]) : [];
    
    // Convert rows to string arrays
    const dataRows = payload.rows.map(row =>
      headers.map(h => {
        const val = row[h];
        return val !== undefined && val !== null ? String(val) : '';
      })
    );
    
    onProgress?.({ percent: 50, message: 'Generating CSV…', cancellable: true });
    
    if (signal?.aborted) {
      throw new Error('Export cancelled');
    }
    
    // Build CSV content
    const csvContent = buildCSV(headers, dataRows);
    
    onProgress?.({ percent: 80, message: 'Preparing download…', cancellable: false });
    
    // Convert to Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = buildFilename(payload);
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
    
    onProgress?.({ percent: 100, message: 'Download started', cancellable: false });
    
    return filename;
  },
};
