/**
 * ExportDemo — Manual QA page for export service and AlertCard.
 *
 * Accessible at /export-demo. Exercises:
 * - PDF + XLSX export with sample data
 * - Redaction pipeline
 * - Alert show / auto-dismiss / pause-on-hover / keyboard dismiss
 */

import { useState, useCallback, useRef } from 'react';
import { Download, Bell, Trash2 } from 'lucide-react';
import { AlertContainer } from '../components/ui';
import { ExportSettingsModal } from '../components/export/ExportSettingsModal';
import { exportService, PLAN_CONFIGURATION_POLICY } from '../services/export';
import { useAlerts } from '../hooks/useAlerts';
import type { ExportConfig, ExportProgress } from '../types/export';

const SAMPLE_DATA: Record<string, unknown>[] = [
  { _id: 'abc123', plan: 'starter', displayName: 'Starter', description: 'Entry-level plan', billingModel: 'fixed', baseCost: 2900, pricePerSeat: 0, maxSeats: 5, maxCatalogItems: 50, features: ['Basic support', 'Email alerts'], sortOrder: 1, status: 'active' },
  { _id: 'def456', plan: 'professional', displayName: 'Professional', description: 'Mid-tier plan', billingModel: 'dynamic', baseCost: 9900, pricePerSeat: 500, maxSeats: 50, maxCatalogItems: 500, features: ['Priority support', 'API access', 'Webhooks'], sortOrder: 2, status: 'active' },
  { _id: 'ghi789', plan: 'enterprise', displayName: 'Enterprise', description: 'Full-featured plan', billingModel: 'dynamic', baseCost: 29900, pricePerSeat: 300, maxSeats: -1, maxCatalogItems: -1, features: ['Dedicated support', 'SLA', 'SSO', 'Custom integrations'], sortOrder: 3, status: 'active' },
];

export default function ExportDemo() {
  const { alerts, showAlert, dismissAlert, clearAll } = useAlerts();
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | undefined>();
  const exportAbort = useRef<AbortController | null>(null);

  const handleExport = useCallback(async (config: ExportConfig) => {
    const abort = new AbortController();
    exportAbort.current = abort;
    setExporting(true);
    setExportProgress(undefined);

    const result = await exportService.export(
      SAMPLE_DATA,
      config,
      'demo-user-001',
      (p) => setExportProgress(p),
      abort.signal,
    );

    setExporting(false);
    setExportProgress(undefined);
    exportAbort.current = null;

    if (result.status === 'success') {
      showAlert('success', `Exported ${result.metadata.recordCount} records → ${result.filename}`);
      setExportOpen(false);
    } else if (result.status === 'cancelled') {
      showAlert('info', result.reason);
    } else {
      showAlert('error', result.error);
    }
  }, [showAlert]);

  const handlePreview = useCallback(async (config: ExportConfig) => {
    return exportService.preview(SAMPLE_DATA, config, 'demo-user-001');
  }, []);

  return (
    <div className="min-h-screen bg-black p-8">
      <AlertContainer alerts={alerts} onDismiss={dismissAlert} position="top-right" />

      <ExportSettingsModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={(config) => void handleExport(config)}
        onPreview={handlePreview}
        module="plan-configuration"
        policy={PLAN_CONFIGURATION_POLICY}
        exporting={exporting}
        progress={exportProgress}
        onCancel={() => exportAbort.current?.abort()}
      />

      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Export &amp; Alert Demo</h1>
          <p className="text-gray-500 text-sm">Manual QA for export service and alert cards</p>
        </div>

        {/* Export Section */}
        <section className="bg-[#121212] border border-[#333] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Export</h2>
          <p className="text-sm text-gray-400 mb-4">
            Opens the export modal with sample plan data. Test PDF and XLSX generation,
            field selection, redaction, preview, and cancellation.
          </p>
          <button
            onClick={() => setExportOpen(true)}
            className="export-btn flex items-center gap-2"
          >
            <Download size={18} />
            Open Export Modal
          </button>
        </section>

        {/* Alert Section */}
        <section className="bg-[#121212] border border-[#333] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Alert Cards</h2>
          <p className="text-sm text-gray-400 mb-4">
            Trigger alerts to test auto-dismiss, pause-on-hover, keyboard dismiss (Esc),
            and stacking.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => showAlert('success', 'Operation completed successfully!', 'Success')}
              className="px-4 py-2 rounded-lg bg-green-600/20 text-green-400 text-sm font-medium hover:bg-green-600/30 transition flex items-center gap-2"
            >
              <Bell size={14} /> Success
            </button>
            <button
              onClick={() => showAlert('info', 'This is an informational message.', 'Info')}
              className="px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition flex items-center gap-2"
            >
              <Bell size={14} /> Info
            </button>
            <button
              onClick={() => showAlert('warning', 'Something needs your attention.', 'Warning')}
              className="px-4 py-2 rounded-lg bg-yellow-600/20 text-yellow-400 text-sm font-medium hover:bg-yellow-600/30 transition flex items-center gap-2"
            >
              <Bell size={14} /> Warning
            </button>
            <button
              onClick={() => showAlert('error', 'An error occurred while processing your request.', 'Error')}
              className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 text-sm font-medium hover:bg-red-600/30 transition flex items-center gap-2"
            >
              <Bell size={14} /> Error
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 rounded-lg bg-[#1a1a1a] text-gray-400 text-sm font-medium hover:bg-[#222] transition flex items-center gap-2"
            >
              <Trash2 size={14} /> Clear All
            </button>
          </div>
        </section>

        {/* Instructions */}
        <section className="bg-[#121212] border border-[#333] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-3">Test Checklist</h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Export as PDF → verify file downloads with audit metadata page</li>
            <li>• Export as XLSX → verify Data + Audit sheets</li>
            <li>• Use "Preview" to check redacted data before exporting</li>
            <li>• Deselect fields and verify they are excluded from output</li>
            <li>• Hover over an alert → progress bar should pause</li>
            <li>• Press <kbd className="px-1.5 py-0.5 bg-[#222] rounded text-gray-300">Esc</kbd> while an alert is focused → should dismiss</li>
            <li>• Fire multiple alerts → should stack with spacing</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
