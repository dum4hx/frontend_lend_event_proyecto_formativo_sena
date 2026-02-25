/**
 * Materials Management Page (Legacy - Deprecated)
 * Use Material Categories, Material Types, or Material Instances pages instead.
 * This page is kept for backwards compatibility but is no longer used.
 */
export default function Materials() {
  return (
    <div className="min-h-screen bg-[#121212] p-8 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Materials Module Reorganized</h1>
        <p className="text-gray-400 mb-4">This module has been reorganized into three separate modules:</p>
        <ul className="text-gray-400 space-y-2 text-left inline-block">
          <li>• <strong>Material Categories:</strong> Manage category taxonomy</li>
          <li>• <strong>Material Types:</strong> Manage catalog items</li>
          <li>• <strong>Material Instances:</strong> Manage physical inventory</li>
        </ul>
      </div>
    </div>
  );
}
