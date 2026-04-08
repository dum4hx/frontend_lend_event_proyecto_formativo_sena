/**
 * Shared table-export utilities for PDF and XLSX.
 *
 * Works with generic header/row data so any page can export its table.
 */

import * as XLSX from "xlsx";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface TableExportData {
  /** Column header labels. */
  headers: string[];
  /** Rows keyed by header label. */
  rows: ReadonlyArray<Record<string, string | number>>;
}

export interface SummaryExportEntry {
  label: string;
  value: string | number;
}

// ─── XLSX Export ───────────────────────────────────────────────────────────

export function exportTableToXLSX(
  data: TableExportData,
  filename: string,
  summaryEntries?: ReadonlyArray<SummaryExportEntry>,
): void {
  const { headers, rows } = data;
  const wb = XLSX.utils.book_new();

  // Summary sheet (when entries provided)
  if (summaryEntries && summaryEntries.length > 0) {
    const summaryRows = summaryEntries.map((e) => ({ Metric: e.label, Value: e.value }));
    const summaryWs = XLSX.utils.json_to_sheet(summaryRows, { header: ["Metric", "Value"] });
    summaryWs["!cols"] = [
      { wch: Math.min(Math.max(6, ...summaryEntries.map((e) => String(e.label).length)) + 2, 60) },
      { wch: Math.min(Math.max(5, ...summaryEntries.map((e) => String(e.value).length)) + 2, 40) },
    ];
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
  }

  // Data sheet
  const sheetRows = rows.map((row) =>
    headers.reduce<Record<string, string | number>>((acc, h) => {
      acc[h] = row[h] ?? "";
      return acc;
    }, {}),
  );

  const ws = XLSX.utils.json_to_sheet(sheetRows, { header: headers });

  ws["!cols"] = headers.map((h) => ({
    wch: Math.min(Math.max(h.length, ...rows.map((r) => String(r[h] ?? "").length)) + 2, 50),
  }));

  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, filename);
}

// ─── PDF Export ────────────────────────────────────────────────────────────

/** Escape PDF text-string special characters. */
function esc(text: string | undefined | null): string {
  if (text === undefined || text === null) return "";
  return String(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Truncate with ellipsis. */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "...";
}

export function exportTableToPDF(
  data: TableExportData,
  filename: string,
  title?: string,
  summaryEntries?: ReadonlyArray<SummaryExportEntry>,
): void {
  const { headers, rows } = data;

  const PAGE_W = 842;
  const PAGE_H = 595;
  const MARGIN = 40;
  const HEADER_H = 50;
  const FOOTER_H = 30;
  const ROW_H = 16;
  const FONT_SIZE = 9;
  const HEADER_FONT = 10;

  // Calculate how much vertical space the summary block requires
  const hasSummary = summaryEntries && summaryEntries.length > 0;
  const SUMMARY_COLS = 2;
  const summaryRows = hasSummary ? Math.ceil(summaryEntries.length / SUMMARY_COLS) : 0;
  const SUMMARY_H = hasSummary ? summaryRows * ROW_H + ROW_H + 8 : 0; // +ROW_H for header + 8 for separator

  const usableH = PAGE_H - MARGIN * 2 - HEADER_H - FOOTER_H - SUMMARY_H;
  const rowsPerPage = Math.floor(usableH / ROW_H) - 1;

  const colW = Math.min((PAGE_W - MARGIN * 2) / Math.max(headers.length, 1), 200);

  const pages: Array<ReadonlyArray<Record<string, string | number>>> = [];
  for (let i = 0; i < Math.max(rows.length, 1); i += rowsPerPage) {
    pages.push(rows.slice(i, i + rowsPerPage));
  }

  const streamContents: string[] = [];
  const displayTitle = title ?? "Export Report";
  const timestamp = new Date().toISOString();

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const pageRows = pages[pageIdx];
    let content = "";

    // Header
    content += `BT /F1 12 Tf ${MARGIN} ${PAGE_H - MARGIN - 14} Td (${esc(displayTitle)}) Tj ET\n`;
    content += `BT /F1 8 Tf ${MARGIN} ${PAGE_H - MARGIN - 28} Td (Date: ${esc(timestamp)}  |  Records: ${rows.length}) Tj ET\n`;

    // Summary block (first page only)
    let summaryOffset = 0;
    if (pageIdx === 0 && hasSummary) {
      const summaryTop = PAGE_H - MARGIN - HEADER_H;
      const halfW = (PAGE_W - MARGIN * 2) / SUMMARY_COLS;
      content += `BT /F1 ${HEADER_FONT} Tf ${MARGIN} ${summaryTop} Td (Summary) Tj ET\n`;
      for (let i = 0; i < summaryEntries.length; i++) {
        const col = i % SUMMARY_COLS;
        const row = Math.floor(i / SUMMARY_COLS);
        const x = MARGIN + col * halfW;
        const y = summaryTop - (row + 1) * ROW_H;
        const entry = summaryEntries[i];
        content += `BT /F1 ${FONT_SIZE} Tf ${x + 2} ${y} Td (${esc(truncate(entry.label, 30))}: ${esc(truncate(String(entry.value), 20))}) Tj ET\n`;
      }
      // Separator line
      const sepY = summaryTop - (summaryRows + 1) * ROW_H;
      content += `${MARGIN} ${sepY} m ${PAGE_W - MARGIN} ${sepY} l S\n`;
      summaryOffset = SUMMARY_H;
    }

    // Column headers
    const tableTop = PAGE_H - MARGIN - HEADER_H - summaryOffset;
    for (let c = 0; c < headers.length; c++) {
      const x = MARGIN + c * colW;
      content += `BT /F1 ${HEADER_FONT} Tf ${x + 2} ${tableTop - ROW_H + 4} Td (${esc(truncate(headers[c], 24))}) Tj ET\n`;
    }

    content += `${MARGIN} ${tableTop - ROW_H - 2} m ${MARGIN + headers.length * colW} ${tableTop - ROW_H - 2} l S\n`;

    // Data rows
    for (let r = 0; r < pageRows.length; r++) {
      const row = pageRows[r];
      const y = tableTop - (r + 2) * ROW_H + 4;
      for (let c = 0; c < headers.length; c++) {
        const x = MARGIN + c * colW;
        const val = String(row[headers[c]] ?? "");
        content += `BT /F1 ${FONT_SIZE} Tf ${x + 2} ${y} Td (${esc(truncate(val, 28))}) Tj ET\n`;
      }
    }

    // Footer
    content += `BT /F1 7 Tf ${MARGIN} ${MARGIN - 5} Td (Page ${pageIdx + 1} of ${pages.length}) Tj ET\n`;

    streamContents.push(content);
  }

  // Assemble PDF objects
  const objects: string[] = [];
  let objCount = 0;

  const addObj = (c: string): number => {
    objCount++;
    objects.push(`${objCount} 0 obj\n${c}\nendobj\n`);
    return objCount;
  };

  const catalogId = addObj("<< /Type /Catalog /Pages 2 0 R >>");

  const pagesIdx = objects.length;
  addObj("");

  addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontId = objCount;

  const pageObjIds: number[] = [];

  for (const streamContent of streamContents) {
    const streamBytes = new TextEncoder().encode(streamContent);
    const streamId = addObj(
      `<< /Length ${streamBytes.length} >>\nstream\n${streamContent}endstream`,
    );

    const pageId = addObj(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${streamId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`,
    );
    pageObjIds.push(pageId);
  }

  objects[pagesIdx] =
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjIds.length} >>\nendobj\n`;

  const header = "%PDF-1.4\n";
  const body = objects.join("\n");
  const xrefOffset = header.length + body.length;
  const xref =
    `xref\n0 ${objCount + 1}\n0000000000 65535 f \n` +
    objects
      .map((_, i) => {
        let offset = header.length;
        for (let j = 0; j < i; j++) {
          offset += objects[j].length + 1;
        }
        return `${String(offset).padStart(10, "0")} 00000 n `;
      })
      .join("\n") +
    "\n";
  const trailer = `trailer\n<< /Size ${objCount + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const pdfString = header + body + xref + trailer;
  const pdfBytes = new TextEncoder().encode(pdfString);

  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}
