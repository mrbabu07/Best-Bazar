import type { Metadata } from "next";
import { ShieldCheck, UserX } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/Badge";
import { users } from "@/lib/data";
import { getDictionary, isLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "User Management | Best Bazar"
};

export default function AdminUsersPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <div>
      <AdminPageHeader
        eyebrow={dictionary.admin.users}
        title={dictionary.admin.users}
        subtitle="View customers, switch roles, ban accounts, and review order volume."
      />

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-paper text-left text-xs font-bold uppercase tracking-[0.12em] text-neutral-500 rtl:text-right">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Orders</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-full bg-gold-100 text-sm font-bold text-navy">
                        {user.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-navy">{user.name}</p>
                        <p className="text-xs text-neutral-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <select defaultValue={user.role} className="h-9 rounded-md border border-neutral-200 bg-paper px-2 text-sm">
                      <option>user</option>
                      <option>admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 text-neutral-600">{user.phone}</td>
                  <td className="px-5 py-4 font-bold text-navy">{user.orders}</td>
                  <td className="px-5 py-4">
                    <Badge tone={user.isBanned ? "red" : "green"}>{user.isBanned ? "Banned" : "Active"}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-gold-200 px-3 text-xs font-bold text-navy hover:bg-gold-50"
                    >
                      {user.isBanned ? <ShieldCheck size={15} /> : <UserX size={15} />}
                      {user.isBanned ? "Unban" : "Ban"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
