/**
 * TeamMemberDetailModal — Read-only detail view for a team member.
 * Shows all member information including assigned locations.
 */
import { useEffect, useState } from "react";
import { DetailModal, StatusBadge, type DetailField } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import {
  getLocations,
  type WarehouseLocation,
} from "../../../../services/warehouseOperatorService";
import type { TeamMember } from "./types";

interface TeamMemberDetailModalProps {
  /** The team member to display, or null if modal is closed. */
  member: TeamMember | null;
  /** Close handler. */
  onClose: () => void;
}

export function TeamMemberDetailModal({ member, onClose }: TeamMemberDetailModalProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  const [memberLocations, setMemberLocations] = useState<WarehouseLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchLocations(): Promise<void> {
      if (!member || member.locations.length === 0) {
        setMemberLocations([]);
        setLoadingLocations(false);
        return;
      }

      setLoadingLocations(true);
      try {
        const res = await getLocations({ limit: 100 });
        if (!cancelled) {
          const filtered = res.data.items.filter(
            (loc) => member.locations.includes(loc.id) || member.locations.includes(loc._id),
          );
          setMemberLocations(filtered);
        }
      } catch {
        if (!cancelled) setMemberLocations([]);
      } finally {
        if (!cancelled) setLoadingLocations(false);
      }
    }

    void fetchLocations();

    return () => {
      cancelled = true;
    };
  }, [member]);

  if (!member) return null;

  const locationsValue: React.ReactNode = loadingLocations ? (
    <span className="text-gray-500 text-sm">{isEs ? "Cargando..." : "Loading..."}</span>
  ) : memberLocations.length === 0 ? (
    <span className="text-gray-500 italic text-sm">
      {isEs ? "Sin ubicaciones asignadas" : "No locations assigned"}
    </span>
  ) : (
    <ul className="space-y-1" data-help-id="team-member-locations">
      {memberLocations.map((loc) => (
        <li key={loc.id} className="text-sm text-gray-300 bg-zinc-800/60 rounded-md px-3 py-1.5">
          {loc.name}
        </li>
      ))}
    </ul>
  );

  const fields: DetailField[] = [
    {
      label: isEs ? "Nombre completo" : "Full Name",
      value: member.fullName,
    },
    {
      label: isEs ? "Correo electrónico" : "Email",
      value: member.email,
    },
    {
      label: isEs ? "Teléfono" : "Phone",
      value: member.phone || "—",
    },
    {
      label: isEs ? "Rol" : "Role",
      value: member.roleName,
    },
    {
      label: isEs ? "Estado" : "Status",
      value: <StatusBadge status={member.status} />,
    },
    {
      label: isEs ? "Ubicaciones" : "Locations",
      value: locationsValue,
    },
  ];

  return (
    <DetailModal
      open={!!member}
      onClose={onClose}
      title={isEs ? "Detalle del Miembro" : "Member Details"}
      fields={fields}
      size="md"
    />
  );
}
