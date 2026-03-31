/**
 * TeamMemberDetailModal — read-only detail view for a team member.
 */
import { Modal } from "../../../../components/ui";
import { StatusBadge } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import type { TeamMember } from "./types";

interface TeamMemberDetailModalProps {
  member: TeamMember | null;
  onClose: () => void;
}

export function TeamMemberDetailModal({ member, onClose }: TeamMemberDetailModalProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  if (!member) return null;

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: isEs ? "Nombre" : "Name", value: member.fullName },
    { label: isEs ? "Correo" : "Email", value: member.email },
    { label: isEs ? "Teléfono" : "Phone", value: member.phone || "—" },
    { label: isEs ? "Rol" : "Role", value: member.roleName },
    {
      label: isEs ? "Estado" : "Status",
      value: <StatusBadge status={member.status} />,
    },
  ];

  return (
    <Modal
      open={!!member}
      onClose={onClose}
      title={isEs ? "Detalle del Miembro" : "Member Detail"}
      size="sm"
    >
      <dl className="flex flex-col gap-3">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 py-2 border-b border-zinc-800 last:border-0"
          >
            <dt className="text-sm text-zinc-500 shrink-0">{label}</dt>
            <dd className="text-sm text-zinc-200 text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
