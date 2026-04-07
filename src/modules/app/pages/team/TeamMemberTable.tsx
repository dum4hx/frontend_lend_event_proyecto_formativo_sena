/**
 * TeamMemberTable — DataTable wrapper for team members.
 *
 * Action buttons are permission-guarded:
 *   - View    → users:read
 *   - Edit    → users:update
 *   - Deactivate / Reactivate → users:update
 */
import { Eye, Pencil, UserX, UserCheck, MailCheck } from "lucide-react";
import { motion } from "framer-motion";
import { DataTable } from "../../../../components/ui/DataTable";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { PermissionGuardedButton } from "../../../../components/ui/PermissionGuardedButton";
import { TruncatedText } from "../../../../components/ui/TruncatedText";
import { useLanguage } from "../../../../contexts/useLanguage";
import { listItemVariants } from "../../../../lib/animations";
import type { ColumnDef } from "../../../../components/ui/DataTable";
import type { TeamMember } from "./types";

const STATUS_COLOR_MAP: Record<string, string> = {
  active: "bg-green-500/15 text-green-400 border-green-500/25",
  inactive: "bg-zinc-700/40 text-zinc-400 border-zinc-600/30",
  invited: "bg-blue-500/15 text-blue-400 border-blue-500/25",
};

const STATUS_LABEL_ES: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  invited: "Invitado",
};

interface TeamMemberTableProps {
  members: TeamMember[];
  isLoading: boolean;
  onView: (member: TeamMember) => void;
  onEdit: (member: TeamMember) => void;
  onDeactivate: (member: TeamMember) => void;
  onReactivate: (member: TeamMember) => void;
  onResendInvite: (member: TeamMember) => void;
}

export function TeamMemberTable({
  members,
  isLoading,
  onView,
  onEdit,
  onDeactivate,
  onReactivate,
  onResendInvite,
}: TeamMemberTableProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  const columns: ColumnDef<TeamMember>[] = [
    {
      key: "fullName",
      header: isEs ? "Nombre" : "Name",
      render: (m) => (
        <button
          onClick={() => onView(m)}
          className="text-yellow-400 hover:text-yellow-300 font-medium text-sm transition-colors text-left"
        >
          <TruncatedText text={m.fullName} maxLength={32} />
        </button>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (m) => (
        <span className="text-zinc-300 text-sm font-mono">
          <TruncatedText text={m.email} maxLength={30} />
        </span>
      ),
    },
    {
      key: "phone",
      header: isEs ? "Teléfono" : "Phone",
      render: (m) => <span className="text-zinc-400 text-sm tabular-nums">{m.phone || "—"}</span>,
    },
    {
      key: "roleName",
      header: isEs ? "Rol" : "Role",
      render: (m) => (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-700/50 text-zinc-300 border border-zinc-600/30">
          {m.roleName}
        </span>
      ),
    },
    {
      key: "status",
      header: isEs ? "Estado" : "Status",
      render: (m) => (
        <StatusBadge
          status={m.status}
          colorMap={STATUS_COLOR_MAP}
          label={isEs ? STATUS_LABEL_ES[m.status] : undefined}
        />
      ),
    },
    {
      key: "id",
      header: isEs ? "Acciones" : "Actions",
      render: (m) => (
        <div className="flex items-center gap-1.5">
          <PermissionGuardedButton
            icon={Eye}
            ariaLabel={isEs ? "Ver detalle" : "View detail"}
            intent="view"
            requiredPermission="users:read"
            deniedMessage={
              isEs
                ? "Necesitas el permiso users:read para ver detalles."
                : "You need users:read permission to view details."
            }
            onClick={() => onView(m)}
          />
          <PermissionGuardedButton
            icon={Pencil}
            ariaLabel={isEs ? "Editar" : "Edit"}
            intent="edit"
            requiredPermission="users:update"
            deniedMessage={
              isEs
                ? "Necesitas el permiso users:update para editar miembros."
                : "You need users:update permission to edit members."
            }
            onClick={() => onEdit(m)}
          />
          {m.status === "active" || m.status === "invited" ? (
            <>
              {m.status === "invited" && (
                <PermissionGuardedButton
                  icon={MailCheck}
                  ariaLabel={isEs ? "Reenviar invitación" : "Resend invitation"}
                  intent="approve"
                  requiredPermission="users:create"
                  deniedMessage={
                    isEs
                      ? "Necesitas el permiso users:create para reenviar invitaciones."
                      : "You need users:create permission to resend invitations."
                  }
                  onClick={() => onResendInvite(m)}
                />
              )}
              <PermissionGuardedButton
                icon={UserX}
                ariaLabel={isEs ? "Desactivar" : "Deactivate"}
                intent="delete"
                requiredPermission="users:update"
                deniedMessage={
                  isEs
                    ? "Necesitas el permiso users:update para desactivar miembros."
                    : "You need users:update permission to deactivate members."
                }
                onClick={() => onDeactivate(m)}
              />
            </>
          ) : (
            <PermissionGuardedButton
              icon={UserCheck}
              ariaLabel={isEs ? "Reactivar" : "Reactivate"}
              intent="approve"
              requiredPermission="users:update"
              deniedMessage={
                isEs
                  ? "Necesitas el permiso users:update para reactivar miembros."
                  : "You need users:update permission to reactivate members."
              }
              onClick={() => onReactivate(m)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <motion.div variants={listItemVariants}>
      <DataTable<TeamMember>
        columns={columns}
        data={members}
        loading={isLoading}
        emptyMessage={isEs ? "No se encontraron miembros." : "No team members found."}
      />
    </motion.div>
  );
}
