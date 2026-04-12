import { useEffect, useState } from "react";
import { LoadingSpinner } from "../../components/ui";
import { useLanguage } from "../useLanguage";
import type { Customer, Loan, LoanRequest, LoanRequestStatus, Package, MaterialType } from "../../types/api";
import { getLoan, getRequests } from "../../services/loanService";
import { getCustomer } from "../../services/customerService";
import { getMaterialTypes, getPackages } from "../../services/materialService";
import { LoanDetailModal } from "../../modules/app/pages/loans/LoanDetailModal";
import { buildUnifiedLoanViews } from "../../modules/app/pages/loans/helpers";
import type { UnifiedLoanView } from "../../modules/app/pages/loans/types";

interface LoanDetailLauncherProps {
  id: string;
  onClose: () => void;
}

function isCustomer(value: Loan["customerId"]): value is Customer {
  return typeof value === "object" && value !== null;
}

function mapLoanStatusToRequestStatus(status: Loan["status"]): LoanRequestStatus {
  if (status === "active" || status === "overdue") return "shipped";
  return "completed";
}

function buildFallbackRequest(loan: Loan, customer: Customer): LoanRequest {
  return {
    _id: loan.requestId ?? `fallback-${loan._id}`,
    code: loan.requestCode,
    customerId: {
      _id: customer._id,
      email: customer.email,
      name: customer.name,
    },
    items:
      loan.pricingSnapshot?.map((item) => {
        const isPackage = item.itemType.toLowerCase().includes("package");
        return {
          type: isPackage ? "package" : "material",
          referenceId: item.referenceId,
          packageId: isPackage ? item.referenceId : undefined,
          materialTypeId: isPackage ? undefined : item.referenceId,
          quantity: item.quantity,
          pricePerDay: item.basePricePerDay,
          pricingConfigId: item.configId,
          pricingStrategyType: item.strategyType,
          totalPrice: item.totalPrice,
        };
      }) ?? [],
    startDate: loan.startDate,
    endDate: loan.endDate,
    status: mapLoanStatusToRequestStatus(loan.status),
    notes: loan.notes,
    depositAmount: loan.deposit.amount,
    totalAmount: loan.totalAmount,
    loanId: loan._id,
    createdAt: loan.createdAt,
    updatedAt: loan.updatedAt,
  };
}

async function findLoanRequest(loan: Loan, customerId: string): Promise<LoanRequest | null> {
  if (!loan.requestId) return null;

  const pageSize = 100;
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 20) {
    const response = await getRequests({ page, limit: pageSize, customerId });
    const requests = response.data.requests ?? [];

    const match = requests.find(
      (request) => request._id === loan.requestId || request.loanId === loan._id,
    );
    if (match) return match;

    totalPages = response.data.totalPages || 1;
    page += 1;
  }

  return null;
}

async function resolveCustomer(loan: Loan): Promise<Customer> {
  if (isCustomer(loan.customerId)) return loan.customerId;
  const response = await getCustomer(loan.customerId);
  return response.data.customer;
}

export default function LoanDetailLauncher({ id, onClose }: LoanDetailLauncherProps) {
  const { language } = useLanguage();
  const lang = language === "es" ? "es" : "en";

  const [view, setView] = useState<UnifiedLoanView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);

        const loanResponse = await getLoan(id);
        const loan = loanResponse.data.loan;
        const customer = await resolveCustomer(loan);

        const [request, materialTypesResponse, packagesResponse] = await Promise.all([
          findLoanRequest(loan, customer._id),
          getMaterialTypes({}),
          getPackages({ page: 1, limit: 100 }),
        ]);

        const effectiveRequest = request ?? buildFallbackRequest(loan, customer);

        const unified = buildUnifiedLoanViews(
          [effectiveRequest],
          [loan],
          [customer],
          packagesResponse.data.packages ?? [],
          materialTypesResponse.data.materialTypes ?? [],
          lang,
        );

        const nextView = unified.find((entry) => entry.loan?._id === loan._id) ?? unified[0] ?? null;

        if (!cancelled) {
          if (nextView) {
            setView(nextView);
          } else {
            setError("Failed to build loan detail view.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load loan details.");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [id, lang]);

  if (error) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
        <div className="bg-[#121212] border border-[#333] rounded-xl w-full max-w-md p-6 space-y-4">
          <p className="text-red-300 text-sm">{error}</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-[#444] text-gray-200 hover:bg-[#1a1a1a]"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <LoanDetailModal open onClose={onClose} view={view} />;
}
