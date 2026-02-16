/**
 * Excel (XLSX) Export Adapter.
 *
 * Produces a downloadable XLSX file with:
 * - Sheet 1 ("Data"): the exported rows with column headers
 * - Sheet 2 ("Audit"): export metadata + checksum for verification
 *
 * This adapter generates a valid XLSX (ZIP of XML files) using
 * plain TypeScript. It can be swapped for a full-featured XLSX
 * library later without changing the adapter interface.
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
  return `${payload.config.module}-export-${yyyy}${mm}${dd}-${payload.metadata.exportId}.xlsx`;
}

function escXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Convert a zero-based column index to a spreadsheet column letter (A, B, ..., Z, AA, ...). */
function colLetter(index: number): string {
  let result = '';
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

// ─── Minimal XLSX Builder ──────────────────────────────────────────────────

/**
 * Build XML for a worksheet from rows of string cells.
 */
function buildSheetXml(
  headers: string[],
  rows: string[][],
): string {
  let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  xml += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n';
  xml += '<sheetData>\n';

  // Header row
  xml += '<row r="1">\n';
  for (let c = 0; c < headers.length; c++) {
    xml += `<c r="${colLetter(c)}1" t="inlineStr"><is><t>${escXml(headers[c])}</t></is></c>\n`;
  }
  xml += '</row>\n';

  // Data rows
  for (let r = 0; r < rows.length; r++) {
    const rowNum = r + 2;
    xml += `<row r="${rowNum}">\n`;
    for (let c = 0; c < rows[r].length; c++) {
      xml += `<c r="${colLetter(c)}${rowNum}" t="inlineStr"><is><t>${escXml(rows[r][c])}</t></is></c>\n`;
    }
    xml += '</row>\n';
  }

  xml += '</sheetData>\n</worksheet>';
  return xml;
}

/**
 * Build a minimal XLSX file (which is a ZIP of XML files).
 * Uses the Compression Streams API when available, otherwise
 * stores data uncompressed in ZIP format.
 */
async function buildXlsxBytes(
  payload: ExportPayload,
  onProgress?: (progress: ExportProgress) => void,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  const { columns, rows, metadata, config } = payload;

  onProgress?.({ percent: 30, message: 'Building data sheet…', cancellable: true });
  if (signal?.aborted) throw new Error('Export cancelled');

  // Data sheet
  const dataHeaders = columns.map((c) => c.label);
  const dataRows = rows.map((row) =>
    columns.map((col) => String(row[col.key] ?? '')),
  );
  const dataSheetXml = buildSheetXml(dataHeaders, dataRows);

  onProgress?.({ percent: 50, message: 'Building audit sheet…', cancellable: true });
  if (signal?.aborted) throw new Error('Export cancelled');

  // Audit sheet
  const auditHeaders = ['Property', 'Value'];
  const auditRows: string[][] = [
    ['Export ID', metadata.exportId],
    ['Timestamp', metadata.timestamp],
    ['Initiating User (hashed)', metadata.initiatingUserHash],
    ['Module', metadata.module],
    ['Module Display Name', metadata.moduleDisplayName],
    ['Record Count', String(metadata.recordCount)],
    ['Data Checksum', metadata.dataChecksum],
    ['Full Export Requested', String(metadata.fullExportRequested)],
    ['App Version', metadata.appVersion],
    ['Included Fields', metadata.includedFields.join(', ')],
    ['Redacted Fields', metadata.redactedFields.join(', ')],
    ['Filters Used', JSON.stringify(metadata.filtersUsed)],
    ['Format', config.format],
  ];
  const auditSheetXml = buildSheetXml(auditHeaders, auditRows);

  // Additional named sheets (e.g. "Totals")
  const extraSheets = payload.additionalSheets ?? [];
  const extraSheetXmls: string[] = [];
  for (const sheet of extraSheets) {
    const hdrs = sheet.columns.map((c) => c.label);
    const sheetDataRows = sheet.rows.map((row) =>
      sheet.columns.map((col) => String(row[col.key] ?? '')),
    );
    extraSheetXmls.push(buildSheetXml(hdrs, sheetDataRows));
  }

  onProgress?.({ percent: 70, message: 'Assembling XLSX package…', cancellable: false });

  // Dynamic sheet count: Data + extra sheets + Audit
  const totalSheets = 1 + extraSheetXmls.length + 1;
  const auditSheetNum = totalSheets; // 1-based

  // Build dynamic XML parts
  let overrides = '';
  let sheetElements = '';
  let sheetRels = '';
  for (let i = 1; i <= totalSheets; i++) {
    overrides += `  <Override PartName="/xl/worksheets/sheet${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n`;
    const name = i === 1 ? 'Data' : i === auditSheetNum ? 'Audit' : escXml(extraSheets[i - 2].name);
    sheetElements += `    <sheet name="${name}" sheetId="${i}" r:id="rId${i}"/>\n`;
    sheetRels += `  <Relationship Id="rId${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i}.xml"/>\n`;
  }

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n  <Default Extension="xml" ContentType="application/xml"/>\n  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>\n${overrides}</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>\n</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\n  <sheets>\n${sheetElements}  </sheets>\n</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n${sheetRels}</Relationships>`;

  // Build a minimal ZIP
  const files: Array<{ path: string; content: Uint8Array }> = [
    { path: '[Content_Types].xml', content: new TextEncoder().encode(contentTypesXml) },
    { path: '_rels/.rels', content: new TextEncoder().encode(relsXml) },
    { path: 'xl/workbook.xml', content: new TextEncoder().encode(workbookXml) },
    { path: 'xl/_rels/workbook.xml.rels', content: new TextEncoder().encode(workbookRelsXml) },
    { path: 'xl/worksheets/sheet1.xml', content: new TextEncoder().encode(dataSheetXml) },
  ];

  // Extra sheets (e.g. Totals)
  for (let i = 0; i < extraSheetXmls.length; i++) {
    files.push({
      path: `xl/worksheets/sheet${i + 2}.xml`,
      content: new TextEncoder().encode(extraSheetXmls[i]),
    });
  }

  // Audit sheet (always last)
  files.push({
    path: `xl/worksheets/sheet${auditSheetNum}.xml`,
    content: new TextEncoder().encode(auditSheetXml),
  });

  return buildZip(files);
}

// ─── Minimal ZIP Builder ───────────────────────────────────────────────────

/** CRC-32 lookup table. */
const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZip(files: Array<{ path: string; content: Uint8Array }>): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const crc = crc32(file.content);
    const size = file.content.length;

    // Local file header
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034b50, true); // local file header sig
    view.setUint16(4, 20, true); // version needed
    view.setUint16(6, 0, true); // flags
    view.setUint16(8, 0, true); // compression (store)
    view.setUint16(10, 0, true); // mod time
    view.setUint16(12, 0, true); // mod date
    view.setUint32(14, crc, true);
    view.setUint32(18, size, true); // compressed size
    view.setUint32(22, size, true); // uncompressed size
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true); // extra field length
    localHeader.set(nameBytes, 30);

    parts.push(localHeader);
    parts.push(file.content);

    // Central directory entry
    const cdEntry = new Uint8Array(46 + nameBytes.length);
    const cdView = new DataView(cdEntry.buffer);
    cdView.setUint32(0, 0x02014b50, true); // central dir sig
    cdView.setUint16(4, 20, true); // version made by
    cdView.setUint16(6, 20, true); // version needed
    cdView.setUint16(8, 0, true); // flags
    cdView.setUint16(10, 0, true); // compression
    cdView.setUint16(12, 0, true); // mod time
    cdView.setUint16(14, 0, true); // mod date
    cdView.setUint32(16, crc, true);
    cdView.setUint32(20, size, true);
    cdView.setUint32(24, size, true);
    cdView.setUint16(28, nameBytes.length, true);
    cdView.setUint16(30, 0, true); // extra len
    cdView.setUint16(32, 0, true); // comment len
    cdView.setUint16(34, 0, true); // disk start
    cdView.setUint16(36, 0, true); // internal attrs
    cdView.setUint32(38, 0, true); // external attrs
    cdView.setUint32(42, offset, true); // local header offset
    cdEntry.set(nameBytes, 46);

    centralDirectory.push(cdEntry);

    offset += localHeader.length + file.content.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const entry of centralDirectory) {
    parts.push(entry);
    cdSize += entry.length;
  }

  // End of central directory record
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true); // disk number
  eocdView.setUint16(6, 0, true); // disk with CD
  eocdView.setUint16(8, files.length, true);
  eocdView.setUint16(10, files.length, true);
  eocdView.setUint32(12, cdSize, true);
  eocdView.setUint32(16, cdOffset, true);
  eocdView.setUint16(20, 0, true); // comment length
  parts.push(eocd);

  // Concatenate all parts
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of parts) {
    result.set(part, pos);
    pos += part.length;
  }

  return result;
}

// ─── Adapter ───────────────────────────────────────────────────────────────

export const excelAdapter: ExportAdapter = {
  format: 'xlsx',

  async generate(
    payload: ExportPayload,
    onProgress?: (progress: ExportProgress) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    assertValidPayload(payload);

    onProgress?.({ percent: 10, message: 'Validating export data…', cancellable: true });
    if (signal?.aborted) throw new Error('Export cancelled');

    const xlsxBytes = await buildXlsxBytes(payload, onProgress, signal);

    onProgress?.({ percent: 90, message: 'Preparing download…', cancellable: false });

    const filename = buildFilename(payload);
    const blob = new Blob([xlsxBytes as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
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
