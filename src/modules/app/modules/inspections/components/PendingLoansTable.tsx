import React from "react";
import { ClipboardCheck, Calendar, User, Package } from "lucide-react";
import type { PendingLoan } from "../../../../../types/api";
import { Button } from "../../../../../components/ui";

interface PendingLoansTableProps {
  loans: PendingLoan[];
  onInspect: (loan: PendingLoan) => void;
}

/**
 * Table showing loans that have been returned but not yet inspected.
 */
export const PendingLoansTable: React.FC<PendingLoansTableProps> = ({ loans, onInspect }) => {
  if (loans.length === 0) {
    return (
      <div className="text-center py-16 bg-[#1a1a1a] rounded-xl border border-dashed border-[#333]">
        <ClipboardCheck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-1">All caught up!</h3>
        <p className="text-gray-400">No pending inspections at the moment.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#0f0f0f] border-b border-[#333]">
            <th className="text-left py-4 px-6 text-gray-400 font-semibold text-xs uppercase tracking-wider">
              Loan Info
            </th>
            <th className="text-left py-4 px-6 text-gray-400 font-semibold text-xs uppercase tracking-wider">
              Customer
            </th>
            <th className="text-left py-4 px-6 text-gray-400 font-semibold text-xs uppercase tracking-wider">
              Return Date
            </th>
            <th className="text-left py-4 px-6 text-gray-400 font-semibold text-xs uppercase tracking-wider">
              Items
            </th>
            <th className="text-right py-4 px-6 text-gray-400 font-semibold text-xs uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#222]">
          {loans.map((loan) => (
            <tr key={loan._id} className="hover:bg-[#1a1a1a] transition-all duration-150 group">
              <td className="py-5 px-6">
                <div className="flex flex-col">
                  <span className="text-white font-mono text-sm group-hover:text-[#FFD700] transition-colors">
                    {loan._id.slice(-8).toUpperCase()}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">{loan._id}</span>
                </div>
              </td>
              <td className="py-5 px-6">
                <div className="flex items-center">
                  <User className="w-3.5 h-3.5 text-gray-500 mr-2" />
                  <div className="flex flex-col">
                    <span className="text-gray-200 text-sm font-medium">
                      {`${loan.customerId.name.firstName} ${loan.customerId.name.firstSurname}`}
                    </span>
                    <span className="text-xs text-gray-500">{loan.customerId.email}</span>
                  </div>
                </div>
              </td>
              <td className="py-5 px-6">
                <div className="flex items-center text-gray-400">
                  <Calendar className="w-3.5 h-3.5 mr-2 text-gray-500" />
                  <span className="text-sm">{new Date(loan.endDate).toLocaleDateString()}</span>
                </div>
              </td>
              <td className="py-5 px-6">
                <div className="flex items-center text-gray-400">
                  <Package className="w-3.5 h-3.5 mr-2 text-gray-500" />
                  <span className="text-sm">{loan.materialInstances.length} items</span>
                </div>
              </td>
              <td className="py-5 px-6 text-right">
                <Button
                  onClick={() => onInspect(loan)}
                  className="bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30 hover:bg-[#FFD700] hover:text-black font-bold text-xs py-1.5 h-auto"
                >
                  Start Inspection
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
