/**
 * PDF Export Adapter.
 *
 * Produces a downloadable PDF file with:
 * - Multi-page table layout
 * - Header/footer with export metadata
 * - An embedded machine-readable JSON metadata block on the last page
 *
 * This adapter is engine-agnostic: it builds a virtual document model
 * and converts it to a minimal PDF binary. The implementation can be
 * swapped for a full-featured PDF engine later without changing the
 * adapter interface.
 */

import type {
  ExportAdapter,
  ExportPayload,
  ExportProgress,
} from '../../../types/export';
import { assertValidPayload } from '../validation';

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Build the deterministic filename per spec. */
function buildFilename(payload: ExportPayload): string {
  const date = new Date(payload.metadata.timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${payload.config.module}-export-${yyyy}${mm}${dd}-${payload.metadata.exportId}.pdf`;
}

/** Escape XML/HTML special chars for the SVG/text representation. */
function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Truncate a string with ellipsis if it exceeds maxLen. */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

// ─── Minimal PDF Builder ───────────────────────────────────────────────────

/**
 * Build a minimal valid PDF (PDF-1.4) containing the export tables.
 *
 * This is intentionally simple and produces readable, if unstyled, tables.
 * For production use, replace with a full PDF library via dependency injection.
 */
function buildPdfBytes(payload: ExportPayload): Uint8Array {
  const { columns, rows, metadata, config } = payload;

  // Page geometry (points)
  const PAGE_W = 842; // A4 landscape width
  const PAGE_H = 595; // A4 landscape height
  const MARGIN = 40;
  const HEADER_H = 50;
  const FOOTER_H = 30;
  const ROW_H = 16;
  const FONT_SIZE = 9;
  const HEADER_FONT = 10;

  const usableH = PAGE_H - MARGIN * 2 - HEADER_H - FOOTER_H;
  const rowsPerPage = Math.floor(usableH / ROW_H) - 1; // -1 for column header

  const colW = Math.min(
    (PAGE_W - MARGIN * 2) / Math.max(columns.length, 1),
    200,
  );

  // Split rows into pages
  const pages: Array<typeof rows> = [];
  for (let i = 0; i < Math.max(rows.length, 1); i += rowsPerPage) {
    pages.push(rows.slice(i, i + rowsPerPage));
  }

  // Build page content streams
  const streamContents: string[] = [];

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const pageRows = pages[pageIdx];
    let content = '';

    // Header
    content += `BT /F1 12 Tf ${MARGIN} ${PAGE_H - MARGIN - 14} Td (${esc(metadata.moduleDisplayName)} - Export Report) Tj ET\n`;
    content += `BT /F1 8 Tf ${MARGIN} ${PAGE_H - MARGIN - 28} Td (Export ID: ${esc(metadata.exportId)}  |  Date: ${esc(metadata.timestamp)}  |  Records: ${metadata.recordCount}) Tj ET\n`;

    // Column headers
    const tableTop = PAGE_H - MARGIN - HEADER_H;
    for (let c = 0; c < columns.length; c++) {
      const x = MARGIN + c * colW;
      content += `BT /F1 ${HEADER_FONT} Tf ${x + 2} ${tableTop - ROW_H + 4} Td (${esc(truncate(columns[c].label, 24))}) Tj ET\n`;
    }

    // Horizontal line under headers
    content += `${MARGIN} ${tableTop - ROW_H - 2} m ${MARGIN + columns.length * colW} ${tableTop - ROW_H - 2} l S\n`;

    // Data rows
    for (let r = 0; r < pageRows.length; r++) {
      const row = pageRows[r];
      const y = tableTop - (r + 2) * ROW_H + 4;
      for (let c = 0; c < columns.length; c++) {
        const x = MARGIN + c * colW;
        const val = String(row[columns[c].key] ?? '');
        content += `BT /F1 ${FONT_SIZE} Tf ${x + 2} ${y} Td (${esc(truncate(val, 28))}) Tj ET\n`;
      }
    }

    // Footer
    content += `BT /F1 7 Tf ${MARGIN} ${MARGIN - 5} Td (Page ${pageIdx + 1} of ${pages.length}  |  Checksum: ${esc(metadata.dataChecksum.slice(0, 16))}  |  ${config.fullExport ? 'FULL EXPORT' : 'Redacted'}) Tj ET\n`;

    streamContents.push(content);
  }

  // Additional sheet pages (e.g. Totals)
  const extraSheets = payload.additionalSheets ?? [];
  for (const sheet of extraSheets) {
    const sCols = sheet.columns;
    const sRows = sheet.rows;
    const sColW = Math.min(
      (PAGE_W - MARGIN * 2) / Math.max(sCols.length, 1),
      200,
    );

    // Split this sheet's rows into pages
    const sPages: Array<typeof sRows> = [];
    for (let i = 0; i < Math.max(sRows.length, 1); i += rowsPerPage) {
      sPages.push(sRows.slice(i, i + rowsPerPage));
    }

    for (let sp = 0; sp < sPages.length; sp++) {
      const pageRows = sPages[sp];
      let sc = '';

      // Sheet header
      sc += `BT /F1 12 Tf ${MARGIN} ${PAGE_H - MARGIN - 14} Td (${esc(sheet.name)}) Tj ET\n`;
      sc += `BT /F1 8 Tf ${MARGIN} ${PAGE_H - MARGIN - 28} Td (Sheet: ${esc(sheet.name)}  |  Records: ${sRows.length}) Tj ET\n`;

      // Column headers
      const sTableTop = PAGE_H - MARGIN - HEADER_H;
      for (let c = 0; c < sCols.length; c++) {
        const x = MARGIN + c * sColW;
        sc += `BT /F1 ${HEADER_FONT} Tf ${x + 2} ${sTableTop - ROW_H + 4} Td (${esc(truncate(sCols[c].label, 24))}) Tj ET\n`;
      }
      sc += `${MARGIN} ${sTableTop - ROW_H - 2} m ${MARGIN + sCols.length * sColW} ${sTableTop - ROW_H - 2} l S\n`;

      // Data rows
      for (let r = 0; r < pageRows.length; r++) {
        const row = pageRows[r];
        const y = sTableTop - (r + 2) * ROW_H + 4;
        for (let c = 0; c < sCols.length; c++) {
          const x = MARGIN + c * sColW;
          const val = String(row[sCols[c].key] ?? '');
          sc += `BT /F1 ${FONT_SIZE} Tf ${x + 2} ${y} Td (${esc(truncate(val, 28))}) Tj ET\n`;
        }
      }

      // Footer
      const totalPages = pages.length + extraSheets.reduce((sum, s) => sum + Math.max(Math.ceil(s.rows.length / rowsPerPage), 1), 0);
      sc += `BT /F1 7 Tf ${MARGIN} ${MARGIN - 5} Td (${esc(sheet.name)} - Page ${sp + 1}  |  Total pages: ~${totalPages}) Tj ET\n`;

      streamContents.push(sc);
    }
  }

  // Metadata page (last page with JSON block)
  if (config.includeAuditMetadata) {
    let metaContent = '';
    metaContent += `BT /F1 14 Tf ${MARGIN} ${PAGE_H - MARGIN - 14} Td (Export Audit Metadata) Tj ET\n`;

    const metaJson = JSON.stringify(metadata, null, 2);
    const lines = metaJson.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const y = PAGE_H - MARGIN - 40 - i * 12;
      if (y < MARGIN) break;
      metaContent += `BT /F1 8 Tf ${MARGIN} ${y} Td (${esc(lines[i])}) Tj ET\n`;
    }

    streamContents.push(metaContent);
  }

  // Assemble PDF objects
  const objects: string[] = [];
  let objCount = 0;

  const addObj = (content: string): number => {
    objCount++;
    objects.push(`${objCount} 0 obj\n${content}\nendobj\n`);
    return objCount;
  };

  // 1: Catalog
  const catalogId = addObj('<< /Type /Catalog /Pages 2 0 R >>');

  // 2: Pages (placeholder — we'll overwrite)
  const pagesIdx = objects.length;
  addObj(''); // placeholder

  // 3: Font
  addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontId = objCount;

  // Page objects
  const pageObjIds: number[] = [];
  const streamObjIds: number[] = [];

  for (const streamContent of streamContents) {
    const streamBytes = new TextEncoder().encode(streamContent);
    const streamId = addObj(
      `<< /Length ${streamBytes.length} >>\nstream\n${streamContent}endstream`,
    );
    streamObjIds.push(streamId);

    const pageId = addObj(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${streamId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`,
    );
    pageObjIds.push(pageId);
  }

  // Overwrite Pages object
  const pagesContent = `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjIds.length} >>`;
  objects[pagesIdx] = `2 0 obj\n${pagesContent}\nendobj\n`;

  // Build final PDF
  const header = '%PDF-1.4\n';
  const body = objects.join('\n');
  const xrefOffset = header.length + body.length;
  const xref =
    `xref\n0 ${objCount + 1}\n0000000000 65535 f \n` +
    objects
      .map((_, i) => {
        let offset = header.length;
        for (let j = 0; j < i; j++) {
          offset += objects[j].length + 1;
        }
        return `${String(offset).padStart(10, '0')} 00000 n `;
      })
      .join('\n') +
    '\n';
  const trailer = `trailer\n<< /Size ${objCount + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const pdfString = header + body + xref + trailer;
  return new TextEncoder().encode(pdfString);
}

// ─── Adapter ───────────────────────────────────────────────────────────────

export const pdfAdapter: ExportAdapter = {
  format: 'pdf',

  async generate(
    payload: ExportPayload,
    onProgress?: (progress: ExportProgress) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    // Validate payload before generating
    assertValidPayload(payload);

    onProgress?.({ percent: 10, message: 'Validating export data…', cancellable: true });

    if (signal?.aborted) throw new Error('Export cancelled');

    onProgress?.({ percent: 30, message: 'Building PDF document…', cancellable: true });

    // Build PDF bytes
    const pdfBytes = buildPdfBytes(payload);

    if (signal?.aborted) throw new Error('Export cancelled');

    onProgress?.({ percent: 80, message: 'Preparing download…', cancellable: false });

    // Trigger download
    const filename = buildFilename(payload);
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);

    onProgress?.({ percent: 100, message: 'Download started', cancellable: false });

    return filename;
  },
};
