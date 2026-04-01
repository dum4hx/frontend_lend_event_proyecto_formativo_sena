import type { AvailableMaterialInstance } from "../../../../types/api";

/** A single material type required by the order. */
export interface RequiredMaterialTypeEntry {
  materialTypeId: string;
  materialTypeName: string;
  quantity: number;
}

export interface MaterialTypeRow extends RequiredMaterialTypeEntry {
  currentUserInstances: AvailableMaterialInstance[];
}

export interface ShortfallGroup {
  fromLocationId: string;
  fromLocationName: string;
  items: Array<{
    materialTypeId: string;
    materialTypeName: string;
    quantity: number;
  }>;
}

export interface PrepareOrderModalProps {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** The loan request ID to prepare. */
  requestId: string;
  /** Customer display name shown in the header. */
  customerName: string;
  /**
   * Pre-computed list of material types required by the order (with quantities).
   * The parent is responsible for expanding package items before passing this.
   */
  requiredMaterialTypes: RequiredMaterialTypeEntry[];
  /** Close without any action. */
  onClose: () => void;
  /** Called after a successful preparation so the parent can refresh. */
  onSuccess: () => Promise<void>;
}
