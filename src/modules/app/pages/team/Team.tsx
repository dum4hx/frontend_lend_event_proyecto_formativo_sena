/**
 * Team — Main team management page.
 *
 * Uses server-side filtering/pagination via useUsers().
 * Supports invite, edit, deactivate, reactivate actions.
 */
import { useState, useMemo } from "react";
import { Users, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedPage } from "../../../../components/ui/AnimatedPage";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { Pagination } from "../../../../components/ui/Pagination";
import { useLanguage } from "../../../../contexts/useLanguage";
import { pageVariants } from "../../../../lib/animations";
import { useUsers, useDeactivateUser, useReactivateUser } from "../../../../hooks/queries/useUserQueries";
import { useRoles } from "../../../../hooks/queries/useRoleQueries";
import { useConfirmModal } from "../../../../hooks/useConfirmModal";
import { useActionPermission } from "../../../../hooks/useActionPermission";
import { TeamFilters } from "./TeamFilters";
import { TeamMemberTable } from "./TeamMemberTable";
import { TeamMemberDetailModal } from "./TeamMemberDetailModal";
import { InviteUserModal } from "./InviteUserModal";
import { EditUserModal } from "./EditUserModal";
import type { TeamMember } from "./types";
import type { User, UserStatus } from "../../../../types/api";

const PAGE_SIZE = 15;

/** Map API User → local TeamMember for display. */
function toTeamMember(u: User): TeamMember {
  return {
    id: u._id,
    firstName: u.name.firstName,
    lastName: u.name.firstSurname,
    fullName: `${u.name.firstName} ${u.name.firstSurname}`,
    email: u.email,
    phone: u.phone ?? "",
    roleName: u.roleName,
    roleId: u.roleId,
    // Map "suspended" → "inactive" for display purposes
    status: (u.status === "suspended" ? "inactive" : u.status) as TeamMember["status"],
    locations: u.locations ?? [],
  };
}

export function Team() {
  const { language } = useLanguage();
  const isEs = language === "es";

  // ── Filter state ──────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  // ── Modal state ───────────────────────────────────────────────────────
  const [showInvite, setShowInvite] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [viewingMember, setViewingMember] = useState<TeamMember | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────
  const usersQuery = useUsers({
    search: search || undefined,
    roleId: roleId || undefined,
    status: (status as UserStatus) || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const rolesQuery = useRoles();
  const deactivateMutation = useDeactivateUser();
  const reactivateMutation = useReactivateUser();
  const { showConfirm, ConfirmModal } = useConfirmModal();
  const { guard, isAllowed } = useActionPermission(isEs ? "es" : "en");

  const canInvite = isAllowed("users:create");

  const members: TeamMember[] = useMemo(
    () => (usersQuery.data?.users ?? []).map(toTeamMember),
    [usersQuery.data],
  );

  const totalPages = usersQuery.data?.totalPages ?? 1;
  const total = usersQuery.data?.total ?? 0;

  // ── Stats ─────────────────────────────────────────────────────────────
  const activeCount = members.filter((m) => m.status === "active").length;
  const invitedCount = members.filter((m) => m.status === "invited").length;
  const inactiveCount = members.filter((m) => m.status === "inactive").length;

  // ── Actions ───────────────────────────────────────────────────────────
  async function handleDeactivate(member: TeamMember) {
    const confirmed = await showConfirm({
      title: isEs ? "Desactivar miembro" : "Deactivate member",
      message: isEs
        ? `¿Desactivar a ${member.fullName}? No podrá acceder a la plataforma.`
        : `Deactivate ${member.fullName}? They will lose platform access.`,
      confirmText: isEs ? "Desactivar" : "Deactivate",
      variant: "danger",
    });
    if (confirmed) {
      deactivateMutation.mutate(member.id);
    }
  }

  async function handleReactivate(member: TeamMember) {
    const confirmed = await showConfirm({
      title: isEs ? "Reactivar miembro" : "Reactivate member",
      message: isEs
        ? `¿Reactivar a ${member.fullName}?`
        : `Reactivate ${member.fullName}?`,
      confirmText: isEs ? "Reactivar" : "Reactivate",
      variant: "info",
    });
    if (confirmed) {
      reactivateMutation.mutate(member.id);
    }
  }

  function handleFilterChange<T>(setter: (v: T) => void, resetPage?: boolean) {
    return (v: T) => {
      setter(v);
      if (resetPage) setPage(1);
    };
  }

  const stats = [
    { label: isEs ? "Total" : "Total", value: total },
    { label: isEs ? "Activos" : "Active", value: activeCount },
    { label: isEs ? "Invitados" : "Invited", value: invitedCount },
    { label: isEs ? "Inactivos" : "Inactive", value: inactiveCount },
    { label: isEs ? "Roles" : "Roles", value: rolesQuery.data?.items.length ?? 0 },
  ];

  return (
    <AnimatedPage>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="page-container"
      >
        <div data-help-id="team-title">
          <PageHeader
            title={isEs ? "Equipo" : "Team"}
            subtitle={
              isEs
                ? "Gestiona los miembros de tu organización."
                : "Manage your organization's members."
            }
            actions={
              <button
                onClick={guard(
                  "users:create",
                  () => setShowInvite(true),
                  isEs
                    ? "Necesitas el permiso users:create para invitar miembros."
                    : "You need users:create permission to invite members.",
                )}
                aria-disabled={!canInvite}
                title={
                  canInvite
                    ? (isEs ? "Invitar miembro" : "Invite Member")
                    : (isEs ? "Sin permiso: users:create" : "Missing permission: users:create")
                }
                className={`gold-action-btn flex items-center gap-2 transition-opacity ${!canInvite ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <UserPlus size={16} />
                {isEs ? "Invitar miembro" : "Invite Member"}
              </button>
            }
          />
        </div>

        {/* Stats Bar */}
        <div data-help-id="team-stats" className="stat-grid">
          {stats.map((s) => (
            <div key={s.label} className="depth-card rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div data-help-id="team-filters">
          <TeamFilters
            search={search}
            onSearchChange={handleFilterChange(setSearch, true)}
            roleId={roleId}
            onRoleChange={handleFilterChange(setRoleId, true)}
            status={status}
            onStatusChange={handleFilterChange(setStatus, true)}
            availableRoles={rolesQuery.data?.items ?? []}
          />
        </div>

        {/* Table */}
        <div data-help-id="team-table">
          <TeamMemberTable
            members={members}
            isLoading={usersQuery.isLoading}
            onView={(m) => setViewingMember(m)}
            onEdit={(m) => setEditingMember(m)}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div data-help-id="team-pagination">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}

        {/* Summary */}
        {total > 0 && (
          <p className="text-xs text-zinc-500 text-center">
            {isEs
              ? `Mostrando ${members.length} de ${total} miembros`
              : `Showing ${members.length} of ${total} members`}
          </p>
        )}

        {/* Invite Modal */}
        <InviteUserModal
          open={showInvite}
          onClose={() => setShowInvite(false)}
          onSuccess={() => setShowInvite(false)}
          availableRoles={rolesQuery.data?.items ?? []}
        />

        {/* Edit Modal */}
        <EditUserModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSuccess={() => setEditingMember(null)}
          availableRoles={rolesQuery.data?.items ?? []}
        />

        {/* Detail Modal */}
        <TeamMemberDetailModal
          member={viewingMember}
          onClose={() => setViewingMember(null)}
        />

        {/* Confirm dialogs */}
        <ConfirmModal />

        {/* Hint for Users icon */}
        {!usersQuery.isLoading && members.length === 0 && !search && !roleId && !status && (
          <div className="flex flex-col items-center gap-3 py-12 text-zinc-500">
            <Users size={40} className="text-zinc-700" />
            <p className="text-sm">{isEs ? "Sin miembros aún." : "No members yet."}</p>
          </div>
        )}
      </motion.div>
    </AnimatedPage>
  );
}
