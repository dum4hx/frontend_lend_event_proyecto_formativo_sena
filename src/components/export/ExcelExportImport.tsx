/**
 * ExcelExportImport — Export and Import data as Excel files
 *
 * Features:
 * - Export data to Excel with formatting
 * - Import data from Excel
 * - Yellow (#FFD700) styling for export/import buttons
 */

import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelExportImportProps {
  data: any[];
  filename: string;
  onImport?: (data: any[]) => void;
  showLabels?: boolean;
}

/**
 * Calculates column width based on content
 */
const calculateColumnWidth = (data: any[], columnName: string): number => {
  const maxLength = Math.max(
    columnName.length,
    ...data.map((row) => String(row[columnName] || '').length)
  );
  return Math.min(maxLength + 2, 50);
};

/**
 * Format data for Excel export
 */
const formatDataForExcel = (data: any[]): any[] => {
  return data.map((item) => {
    const formatted: any = {};
    Object.keys(item).forEach((key) => {
      // Skip private/internal fields
      if (key.startsWith('_') || key === 'id') {
        formatted['_id'] = item._id || item.id;
      } else {
        formatted[key] = item[key];
      }
    });
    return formatted;
  });
};

export const ExcelExportImport: React.FC<ExcelExportImportProps> = ({
  data,
  filename,
  onImport,
  showLabels = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle Excel export
   */
  const handleExport = () => {
    try {
      const formattedData = formatDataForExcel(data);

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(formattedData);

      // Set column widths
      if (formattedData.length > 0) {
        const columns = Object.keys(formattedData[0]);
        ws['!cols'] = columns.map((col) =>
          ({
            wch: calculateColumnWidth(formattedData, col),
          })
        );
      }

      // Style header row (yellow background)
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1';
        const cell = ws[address];
        if (cell) {
          cell.s = {
            fill: { fgColor: { rgb: 'FFFFD700' } }, // Yellow background
            font: { bold: true, color: { rgb: 'FF000000' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      }

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');

      // Add timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportFilename = `${filename}-${timestamp.split('T')[0]}.xlsx`;

      // Write file
      XLSX.writeFile(wb, exportFilename);
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Failed to export Excel file');
    }
  };

  /**
   * Handle Excel import
   */
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const bstr = event.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(ws);

          onImport?.(data);
        } catch (error) {
          console.error('Import error:', error);
          throw new Error('Failed to import Excel file');
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Import error:', error);
      throw new Error('Failed to process import file');
    }
  };

  return (
    <div className="flex gap-2">
      {/* Export Button - Yellow accent */}
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] hover:bg-[#FFC700] text-black font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
        title="Export data as Excel"
      >
        <Download size={18} />
        {showLabels && 'Export'}
      </button>

      {/* Import Button - Yellow accent */}
      {onImport && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] hover:bg-[#FFC700] text-black font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
            title="Import data from Excel"
          >
            <Upload size={18} />
            {showLabels && 'Import'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImport}
            className="hidden"
            aria-label="Import Excel file"
          />
        </>
      )}
    </div>
  );
};
