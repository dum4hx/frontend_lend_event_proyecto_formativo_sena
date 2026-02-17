/**
 * ExportSettingsModal — Modal for configuring and triggering data exports.
 *
 * Features:
 * - Format selection (PDF / Excel)
 * - Field selection with category grouping
 * - Date range filters
 * - Audit metadata toggle
 * - Full export (PII) with confirmation warning
 * - Export preview (table layout + metadata)
 * - Progress feedback and cancellation
 */

import {
  useState,
  useMemo,
  useCallback,
} from 'react';
import { Download, FileText, Table2, Eye, X, Shield, AlertTriangle } from 'lucide-react';
import type {
  ExportConfig,
  ExportFormat,
  ExportModule,
  ExportProgress,
  RedactionPolicy,
  ExportFieldConfig,
  ExportPayload,
} from '../../types/export';
import { EXPORT_I18N } from '../../types/export';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ExportSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (config: ExportConfig) => void;
  onPreview?: (config: ExportConfig) => Promise<ExportPayload | undefined>;
  module: ExportModule;
  policy: RedactionPolicy;
  exporting: boolean;
  progress?: ExportProgress;
  onCancel?: () => void;
  allowedFormats?: ExportFormat[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function groupFieldsByCategory(fields: ExportFieldConfig[]): Record<string, ExportFieldConfig[]> {
  const groups: Record<string, ExportFieldConfig[]> = {};
  for (const field of fields) {
    if (!groups[field.category]) {
      groups[field.category] = [];
    }
    groups[field.category].push(field);
  }
  return groups;
}

const CATEGORY_LABELS: Record<string, string> = {
  identifier: 'Identifiers',
  attribute: 'Attributes',
  metric: 'Metrics',
  metadata: 'Metadata',
};

const FORMAT_OPTIONS: Array<{ value: ExportFormat; label: string; Icon: typeof FileText }> = [
  { value: 'pdf', label: EXPORT_I18N['export.format.pdf'], Icon: FileText },
  { value: 'xlsx', label: EXPORT_I18N['export.format.xlsx'], Icon: Table2 },
];

// ─── Component ─────────────────────────────────────────────────────────────

export function ExportSettingsModal({
  isOpen,
  onClose,
  onExport,
  onPreview,
  module,
  policy,
  exporting,
  progress,
  onCancel,
  allowedFormats,
}: ExportSettingsModalProps) {
  const allowed = useMemo<ExportFormat[]>(() => {
    if (allowedFormats && allowedFormats.length > 0) return allowedFormats;
    return FORMAT_OPTIONS.map((o) => o.value);
  }, [allowedFormats]);

  const options = useMemo(() => FORMAT_OPTIONS.filter((o) => allowed.includes(o.value)), [allowed]);

  const [format, setFormat] = useState<ExportFormat>(() => (allowed.includes('xlsx') ? 'xlsx' : allowed[0] ?? 'xlsx'));
  const [selectedFields, setSelectedFields] = useState<Set<string>>(() => {
    return new Set(
      policy.fields.filter((f) => f.defaultSelected).map((f) => f.key),
    );
  });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [includeAudit, setIncludeAudit] = useState(true);
  const [fullExport, setFullExport] = useState(false);
  const [fullExportConfirmed, setFullExportConfirmed] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ExportPayload | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const grouped = useMemo(() => groupFieldsByCategory(policy.fields), [policy.fields]);

  const toggleField = useCallback((key: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedFields(new Set(policy.fields.map((f) => f.key)));
  }, [policy.fields]);

  const deselectAll = useCallback(() => {
    setSelectedFields(new Set());
  }, []);

  const buildConfig = useCallback((): ExportConfig => ({
    format,
    module,
    selectedFields: Array.from(selectedFields),
    includeAuditMetadata: includeAudit,
    fullExport: fullExport && fullExportConfirmed,
    dateRange: dateFrom || dateTo ? { from: dateFrom || undefined, to: dateTo || undefined } : undefined,
    filters: {},
  }), [format, module, selectedFields, includeAudit, fullExport, fullExportConfirmed, dateFrom, dateTo]);

  const handleSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (selectedFields.size === 0) return;
      onExport(buildConfig());
    },
    [onExport, buildConfig, selectedFields],
  );

  const handlePreview = useCallback(async () => {
    if (!onPreview || selectedFields.size === 0) return;
    setPreviewLoading(true);
    try {
      const result = await onPreview(buildConfig());
      if (result) {
        setPreviewData(result);
        setShowPreview(true);
      }
    } finally {
      setPreviewLoading(false);
    }
  }, [onPreview, buildConfig, selectedFields]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !exporting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={EXPORT_I18N['export.title']}
    >
      <div className="modal-content" style={{ maxWidth: '680px' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Download size={20} className="text-[#FFD700]" />
            <h2 className="text-xl font-bold text-white">{EXPORT_I18N['export.title']}</h2>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            disabled={exporting}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-5">
            {/* Format Selection */}
            <div>
              <label className="form-label mb-2">{EXPORT_I18N['export.format']}</label>
              <div className="flex gap-3">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormat(opt.value)}
                    className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                      format === opt.value
                        ? 'border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]'
                        : 'border-[#333] bg-[#1a1a1a] text-gray-400 hover:border-[#555]'
                    }`}
                    aria-pressed={format === opt.value}
                  >
                    <opt.Icon size={18} />
                    <span className="font-medium text-sm">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Field Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="form-label">{EXPORT_I18N['export.fields']}</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs text-[#FFD700] hover:underline"
                  >
                    {EXPORT_I18N['export.fields.selectAll']}
                  </button>
                  <span className="text-gray-600">|</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    {EXPORT_I18N['export.fields.deselectAll']}
                  </button>
                </div>
              </div>
              <div className="bg-[#0d0d0d] border border-[#333] rounded-lg p-3 max-h-48 overflow-y-auto space-y-3">
                {Object.entries(grouped).map(([category, fields]) => (
                  <div key={category}>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                      {CATEGORY_LABELS[category] ?? category}
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {fields.map((field) => {
                        const isLocked = field.redaction === 'exclude' && !field.overridable;
                        const isSelected = selectedFields.has(field.key);
                        return (
                          <label
                            key={field.key}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#FFD700]/5 text-white'
                                : 'text-gray-500 hover:text-gray-300'
                            } ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => !isLocked && toggleField(field.key)}
                              disabled={isLocked}
                              className="accent-[#FFD700] w-3.5 h-3.5"
                            />
                            <span>{field.label}</span>
                            {field.redaction === 'hash' && (
                              <span className="ml-auto" aria-label="Pseudonymized">
                                <Shield size={12} className="text-blue-400" />
                              </span>
                            )}
                            {field.redaction === 'exclude' && field.overridable && !fullExport && (
                              <span className="ml-auto" aria-label="Excluded by default">
                                <Shield size={12} className="text-yellow-400" />
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {selectedFields.size === 0 && (
                <p className="form-error mt-1">At least one field must be selected</p>
              )}
            </div>

            {/* Date Range */}
            <div>
              <label className="form-label mb-2">{EXPORT_I18N['export.dateRange']}</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{EXPORT_I18N['export.dateRange.from']}</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="input text-sm"
                    disabled={exporting}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{EXPORT_I18N['export.dateRange.to']}</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="input text-sm"
                    disabled={exporting}
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {/* Audit metadata */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAudit}
                  onChange={(e) => setIncludeAudit(e.target.checked)}
                  className="accent-[#FFD700] w-4 h-4"
                  disabled={exporting}
                />
                <span className="text-sm text-gray-300">{EXPORT_I18N['export.audit']}</span>
              </label>

              {/* Full export */}
              {policy.requiresFullExportConfirmation && (
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fullExport}
                      onChange={(e) => {
                        setFullExport(e.target.checked);
                        if (!e.target.checked) setFullExportConfirmed(false);
                      }}
                      className="accent-[#FFD700] w-4 h-4"
                      disabled={exporting}
                    />
                    <span className="text-sm text-yellow-400 font-medium">
                      {EXPORT_I18N['export.fullExport']}
                    </span>
                  </label>

                  {fullExport && !fullExportConfirmed && (
                    <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-yellow-300">
                            {EXPORT_I18N['export.fullExport.warning']}
                          </p>
                          <button
                            type="button"
                            onClick={() => setFullExportConfirmed(true)}
                            className="mt-2 text-xs font-semibold text-yellow-400 hover:text-yellow-300 underline"
                          >
                            I understand, proceed with full export
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Progress */}
            {exporting && progress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{progress.message}</span>
                  <span className="text-[#FFD700] font-mono">{Math.round(progress.percent)}%</span>
                </div>
                <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FFD700] rounded-full transition-all duration-100"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Preview */}
            {showPreview && previewData && (
              <div className="bg-[#0d0d0d] border border-[#333] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white">Export Preview</p>
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className="text-xs text-gray-500 hover:text-gray-300"
                  >
                    Hide
                  </button>
                </div>

                {/* Metadata preview */}
                <div className="mb-3 text-xs text-gray-500 space-y-0.5">
                  <p>Export ID: <span className="text-gray-300">{previewData.metadata.exportId}</span></p>
                  <p>Records: <span className="text-gray-300">{previewData.metadata.recordCount}</span></p>
                  <p>Checksum: <span className="text-gray-300 font-mono">{previewData.metadata.dataChecksum.slice(0, 24)}…</span></p>
                </div>

                {/* Table preview (first 5 rows) */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#333]">
                        {previewData.columns.map((col) => (
                          <th key={col.key} className="text-left px-2 py-1 text-gray-500 font-medium">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-[#222]">
                          {previewData.columns.map((col) => (
                            <td key={col.key} className="px-2 py-1 text-gray-400 truncate max-w-[120px]">
                              {String(row[col.key] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.rows.length > 5 && (
                    <p className="text-xs text-gray-600 mt-1 text-center">
                      …and {previewData.rows.length - 5} more rows
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            {onPreview && (
              <button
                type="button"
                onClick={() => void handlePreview()}
                className="btn-secondary flex items-center gap-2 text-sm mr-auto"
                disabled={exporting || selectedFields.size === 0 || previewLoading}
              >
                <Eye size={16} />
                {previewLoading ? 'Loading…' : EXPORT_I18N['export.preview']}
              </button>
            )}

            {exporting && progress?.cancellable && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn-danger text-sm"
              >
                {EXPORT_I18N['export.cancel']}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-sm"
              disabled={exporting}
            >
              {EXPORT_I18N['export.cancel']}
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2 text-sm"
              disabled={exporting || selectedFields.size === 0 || (fullExport && !fullExportConfirmed)}
            >
              <Download size={16} />
              {exporting ? EXPORT_I18N['export.exporting'] : EXPORT_I18N['export.download']}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
