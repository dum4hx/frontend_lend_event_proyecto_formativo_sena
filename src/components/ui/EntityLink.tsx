/**
 * EntityLink — Inline clickable element that opens a detail modal
 * for any entity (customer, material type, material instance, location, category).
 *
 * Stops event propagation so parent row-click handlers are not triggered.
 * Renders as plain text when entityId is empty/falsy.
 *
 * Usage:
 *   <EntityLink entityType="customer" entityId={customerId} label={customerName} />
 */

import type { MouseEvent } from "react";
import { useEntityDetail } from "../../contexts/useEntityDetail";
import type { EntityType } from "../../contexts/entityDetailContextDefinition";

export interface EntityLinkProps {
  /** The entity type to open a detail modal for. */
  entityType: EntityType;
  /** The entity's MongoDB _id. When empty, renders as plain text. */
  entityId: string;
  /** Display text. */
  label: string;
  /** Optional extra Tailwind classes appended to the button. */
  className?: string;
}

export function EntityLink({ entityType, entityId, label, className = "" }: EntityLinkProps) {
  const { openEntityDetail } = useEntityDetail();

  if (!entityId || entityId === "Unknown" || entityId.trim() === "") {
    return <span className={className}>{label}</span>;
  }

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    openEntityDetail(entityType, entityId);
  };

  return (
    <button type="button" onClick={handleClick} className={`entity-link ${className}`.trim()}>
      {label}
    </button>
  );
}
