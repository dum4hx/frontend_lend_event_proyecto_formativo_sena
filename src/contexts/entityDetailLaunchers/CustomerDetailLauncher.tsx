import { useEffect, useState } from "react";
import { LoadingSpinner, ErrorDisplay } from "../../components/ui";
import { CustomerDetailModal } from "../../modules/app/pages/customers/CustomerDetailModal";
import { getCustomer, getDocumentTypes } from "../../services/customerService";
import type { Customer, DocumentTypeInfo } from "../../types/api";

interface Props {
  id: string;
  onClose: () => void;
}

export default function CustomerDetailLauncher({ id, onClose }: Props) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCustomer(id), getDocumentTypes()])
      .then(([customerRes, docTypesRes]) => {
        if (cancelled) return;
        setCustomer(customerRes.data.customer);
        setDocumentTypes(docTypesRes.data.documentTypes);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load customer details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
          <ErrorDisplay error={error ?? "Customer not found."} />
          <button type="button" onClick={onClose} className="mt-4 w-full btn-secondary text-sm">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <CustomerDetailModal
      customer={customer}
      open={true}
      onClose={onClose}
      documentTypes={documentTypes}
      onEdit={() => {}}
    />
  );
}
