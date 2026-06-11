"use client";

import { Edit, Plus, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n";
import { safeResponseJson } from "@/lib/safe-json";
import { formatCurrency } from "@/utils/currency";

export type AdminCouponRow = {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiryDate: string;
  isActive: boolean;
};

type CouponForm = {
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: string;
  minOrderAmount: string;
  maxUses: string;
  expiryDate: string;
  isActive: boolean;
};

type AdminCouponManagerProps = {
  locale: Locale;
  coupons: AdminCouponRow[];
  saveLabel: string;
};

const emptyForm: CouponForm = {
  code: "",
  discountType: "FIXED",
  discountValue: "0",
  minOrderAmount: "0",
  maxUses: "100",
  expiryDate: "",
  isActive: true
};

function fromCoupon(coupon: AdminCouponRow): CouponForm {
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: String(coupon.discountValue),
    minOrderAmount: String(coupon.minOrderAmount),
    maxUses: String(coupon.maxUses),
    expiryDate: coupon.expiryDate,
    isActive: coupon.isActive
  };
}

export function AdminCouponManager({ locale, coupons, saveLabel }: AdminCouponManagerProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const selectedCoupon = useMemo(
    () => coupons.find((coupon) => coupon.id === selectedId),
    [coupons, selectedId]
  );

  const updateForm = <Key extends keyof CouponForm>(key: Key, value: CouponForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const startCreate = () => {
    setSelectedId("");
    setForm(emptyForm);
  };

  const startEdit = (coupon: AdminCouponRow) => {
    setSelectedId(coupon.id);
    setForm(fromCoupon(coupon));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      code: form.code,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount),
      maxUses: Number(form.maxUses),
      expiryDate: form.expiryDate,
      isActive: form.isActive
    };
    const endpoint = selectedId ? `/api/admin/coupons/${selectedId}` : "/api/admin/coupons";

    try {
      const response = await fetch(endpoint, {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await safeResponseJson<{ error?: string }>(response, {});

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to save coupon.");
      }

      toast.success(selectedId ? "Coupon updated" : "Coupon created");
      if (!selectedId) {
        setForm(emptyForm);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-paper text-left text-xs font-bold uppercase tracking-[0.12em] text-neutral-500 rtl:text-right">
              <tr>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Discount</th>
                <th className="px-5 py-3">Min order</th>
                <th className="px-5 py-3">Usage</th>
                <th className="px-5 py-3">Expiry</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-5 py-4 font-bold text-navy">{coupon.code}</td>
                  <td className="px-5 py-4 text-neutral-600">
                    {coupon.discountType === "PERCENT"
                      ? `${coupon.discountValue}%`
                      : formatCurrency(coupon.discountValue, "AED", locale)}
                  </td>
                  <td className="px-5 py-4 text-neutral-600">
                    {formatCurrency(coupon.minOrderAmount, "AED", locale)}
                  </td>
                  <td className="px-5 py-4 text-neutral-600">
                    {coupon.usedCount}/{coupon.maxUses}
                  </td>
                  <td className="px-5 py-4 text-neutral-600">{coupon.expiryDate}</td>
                  <td className="px-5 py-4">
                    <Badge tone={coupon.isActive ? "green" : "red"}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(coupon)}
                        className="grid h-9 w-9 place-items-center rounded-md border border-gold-200 text-navy hover:bg-gold-50"
                        aria-label={`Edit coupon ${coupon.code}`}
                      >
                        <Edit size={15} />
                      </button>
                      <AdminDeleteButton
                        endpoint={`/api/admin/coupons/${coupon.id}`}
                        label={`Delete coupon ${coupon.code}?`}
                        successMessage="Coupon deleted"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside id="coupon-editor" className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-soft xl:sticky xl:top-24">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-navy">Coupon editor</h2>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              {selectedCoupon ? `Editing ${selectedCoupon.code}` : "Create a new coupon"}
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={startCreate}>
            <Plus size={15} />
            New
          </Button>
        </div>
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Code
            <input
              value={form.code}
              onChange={(event) => updateForm("code", event.target.value)}
              required
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm uppercase"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Discount type
            <select
              value={form.discountType}
              onChange={(event) => updateForm("discountType", event.target.value as CouponForm["discountType"])}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            >
              <option value="FIXED">Fixed amount</option>
              <option value="PERCENT">Percent</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Discount value
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.discountValue}
              onChange={(event) => updateForm("discountValue", event.target.value)}
              required
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Minimum order
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.minOrderAmount}
              onChange={(event) => updateForm("minOrderAmount", event.target.value)}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Max uses
            <input
              type="number"
              min="1"
              value={form.maxUses}
              onChange={(event) => updateForm("maxUses", event.target.value)}
              required
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Expiry date
            <input
              type="date"
              value={form.expiryDate}
              onChange={(event) => updateForm("expiryDate", event.target.value)}
              required
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-navy">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateForm("isActive", event.target.checked)}
              className="accent-gold-500"
            />
            Active
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : saveLabel}
            </Button>
            <Button type="button" variant="secondary" onClick={startCreate}>
              <RotateCcw size={16} />
              Reset
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}
