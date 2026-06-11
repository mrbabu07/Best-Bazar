"use client";

import { ShieldCheck, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { safeResponseJson } from "@/lib/safe-json";

type UserRole = "USER" | "ADMIN";

type AdminUserActionsProps = {
  userId: string;
  initialRole: UserRole;
  initialIsBanned: boolean;
};

export function AdminUserActions({ userId, initialRole, initialIsBanned }: AdminUserActionsProps) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(initialRole);
  const [isBanned, setIsBanned] = useState(initialIsBanned);
  const [savingRole, setSavingRole] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const updateRole = async (nextRole: UserRole) => {
    const previousRole = role;
    setRole(nextRole);
    setSavingRole(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole })
      });
      const result = await safeResponseJson<{ error?: string }>(response, {});

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to update user role.");
      }

      toast.success("User role updated");
      router.refresh();
    } catch (error) {
      setRole(previousRole);
      toast.error(error instanceof Error ? error.message : "Unable to update user role.");
    } finally {
      setSavingRole(false);
    }
  };

  const toggleStatus = async () => {
    const previousStatus = isBanned;
    const nextStatus = !isBanned;
    setIsBanned(nextStatus);
    setSavingStatus(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: nextStatus })
      });
      const result = await safeResponseJson<{ error?: string }>(response, {});

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to update user status.");
      }

      toast.success(nextStatus ? "User banned" : "User unbanned");
      router.refresh();
    } catch (error) {
      setIsBanned(previousStatus);
      toast.error(error instanceof Error ? error.message : "Unable to update user status.");
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={role}
        onChange={(event) => updateRole(event.target.value as UserRole)}
        disabled={savingRole}
        className="h-9 rounded-md border border-neutral-200 bg-paper px-2 text-sm disabled:opacity-60"
      >
        <option>USER</option>
        <option>ADMIN</option>
      </select>
      <button
        type="button"
        onClick={toggleStatus}
        disabled={savingStatus}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-gold-200 px-3 text-xs font-bold text-navy hover:bg-gold-50 disabled:opacity-60"
      >
        {isBanned ? <ShieldCheck size={15} /> : <UserX size={15} />}
        {isBanned ? "Unban" : "Ban"}
      </button>
    </div>
  );
}
