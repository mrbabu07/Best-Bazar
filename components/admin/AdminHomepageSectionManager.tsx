"use client";

import { Edit, Plus, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { Button } from "@/components/ui/Button";
import { safeResponseJson } from "@/lib/safe-json";

type SectionType = "CATEGORY_GRID" | "PRODUCT_GRID";
type Source = "FEATURED" | "NEW" | "CATEGORY" | "TAG";

export type AdminHomepageSectionRow = {
  id: string;
  type: SectionType;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  config: { source?: Source; categorySlug?: string; tag?: string; limit?: number; categoryLimit?: number; actionLabelEn?: string; actionLabelAr?: string; actionLink?: string };
  sortOrder: number;
  isActive: boolean;
};

type FormState = Omit<AdminHomepageSectionRow, "id">;

const emptyForm: FormState = {
  type: "PRODUCT_GRID",
  titleEn: "New arrivals",
  titleAr: "New arrivals",
  subtitleEn: "",
  subtitleAr: "",
  config: { source: "NEW", limit: 4, categoryLimit: 6, actionLabelEn: "View all", actionLabelAr: "View all", actionLink: "/shop" },
  sortOrder: 0,
  isActive: true
};

function toForm(section: AdminHomepageSectionRow): FormState {
  return { ...section, config: { ...emptyForm.config, ...section.config } };
}

export function AdminHomepageSectionManager({ sections }: { sections: AdminHomepageSectionRow[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => setForm((current) => ({ ...current, [key]: value }));
  const updateConfig = <Key extends keyof FormState["config"]>(key: Key, value: FormState["config"][Key]) =>
    setForm((current) => ({ ...current, config: { ...current.config, [key]: value } }));

  const reset = () => { setSelectedId(""); setForm(emptyForm); };
  const edit = (section: AdminHomepageSectionRow) => { setSelectedId(section.id); setForm(toForm(section)); };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const endpoint = selectedId ? `/api/admin/homepage-sections/${selectedId}` : "/api/admin/homepage-sections";
      const response = await fetch(endpoint, {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const result = await safeResponseJson<{ error?: string }>(response, {});
      if (!response.ok) throw new Error(result?.error ?? "Unable to save section.");
      toast.success(selectedId ? "Homepage section updated" : "Homepage section created");
      reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save section.");
    } finally { setSaving(false); }
  };

  return <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
    <section className="grid gap-3">
      {sections.map((section) => <article key={section.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-soft">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-paper text-sm font-black text-navy">{section.sortOrder}</span>
        <div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-[0.12em] text-gold-700">{section.type === "CATEGORY_GRID" ? "Category collection" : section.config.source ?? "Products"}</p><h2 className="mt-1 truncate font-bold text-navy">{section.titleEn || "Untitled section"}</h2><p className="mt-1 text-xs font-semibold text-neutral-500">{section.isActive ? "Visible" : "Hidden"} · {section.type === "CATEGORY_GRID" ? `${section.config.categoryLimit ?? 6} categories` : `${section.config.limit ?? 4} products`}</p></div>
        <button type="button" onClick={() => edit(section)} className="grid h-9 w-9 place-items-center rounded-md border border-neutral-200 text-navy hover:bg-neutral-50" aria-label={`Edit ${section.titleEn}`}><Edit size={16} /></button>
        <AdminDeleteButton endpoint={`/api/admin/homepage-sections/${section.id}`} label={`Delete ${section.titleEn || "homepage section"}?`} successMessage="Homepage section deleted" />
      </article>)}
      {!sections.length ? <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm font-semibold text-neutral-500">No custom sections yet. The storefront fallback remains visible until you add one.</p> : null}
    </section>
    <aside className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-soft xl:sticky xl:top-24">
      <div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-navy">{selectedId ? "Edit section" : "Add homepage section"}</h2><p className="mt-1 text-xs font-semibold text-neutral-500">All visible copy and product sources are admin controlled.</p></div><Button type="button" variant="secondary" size="sm" onClick={reset}><Plus size={15} />New</Button></div>
      <form onSubmit={submit} className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-navy">Section type<select value={form.type} onChange={(event) => update("type", event.target.value as SectionType)} className="h-11 rounded-md border border-neutral-200 bg-paper px-3"><option value="PRODUCT_GRID">Product grid</option><option value="CATEGORY_GRID">Category collection</option></select></label>
        <label className="grid gap-2 text-sm font-semibold text-navy">Title (English)<input value={form.titleEn} onChange={(event) => update("titleEn", event.target.value)} className="h-11 rounded-md border border-neutral-200 bg-paper px-3" /></label>
        <label className="grid gap-2 text-sm font-semibold text-navy">Title (Arabic)<input value={form.titleAr} onChange={(event) => update("titleAr", event.target.value)} className="h-11 rounded-md border border-neutral-200 bg-paper px-3" /></label>
        <label className="grid gap-2 text-sm font-semibold text-navy">Subtitle (English)<input value={form.subtitleEn} onChange={(event) => update("subtitleEn", event.target.value)} className="h-11 rounded-md border border-neutral-200 bg-paper px-3" /></label>
        {form.type === "PRODUCT_GRID" ? <><label className="grid gap-2 text-sm font-semibold text-navy">Products from<select value={form.config.source ?? "FEATURED"} onChange={(event) => updateConfig("source", event.target.value as Source)} className="h-11 rounded-md border border-neutral-200 bg-paper px-3"><option value="FEATURED">Featured products</option><option value="NEW">New arrivals</option><option value="CATEGORY">A category</option><option value="TAG">A product tag</option></select></label>{form.config.source === "CATEGORY" ? <label className="grid gap-2 text-sm font-semibold text-navy">Category slug<input value={form.config.categorySlug ?? ""} onChange={(event) => updateConfig("categorySlug", event.target.value)} placeholder="abaya-collection" className="h-11 rounded-md border border-neutral-200 bg-paper px-3" /></label> : null}{form.config.source === "TAG" ? <label className="grid gap-2 text-sm font-semibold text-navy">Product tag<input value={form.config.tag ?? ""} onChange={(event) => updateConfig("tag", event.target.value)} placeholder="sale" className="h-11 rounded-md border border-neutral-200 bg-paper px-3" /></label> : null}<label className="grid gap-2 text-sm font-semibold text-navy">Products shown<input type="number" min="1" max="12" value={form.config.limit ?? 4} onChange={(event) => updateConfig("limit", Number(event.target.value))} className="h-11 rounded-md border border-neutral-200 bg-paper px-3" /></label></> : <label className="grid gap-2 text-sm font-semibold text-navy">Categories shown<input type="number" min="1" max="12" value={form.config.categoryLimit ?? 6} onChange={(event) => updateConfig("categoryLimit", Number(event.target.value))} className="h-11 rounded-md border border-neutral-200 bg-paper px-3" /></label>}
        <label className="grid gap-2 text-sm font-semibold text-navy">View-all link<input value={form.config.actionLink ?? ""} onChange={(event) => updateConfig("actionLink", event.target.value)} placeholder="/shop" className="h-11 rounded-md border border-neutral-200 bg-paper px-3" /></label><label className="flex items-center gap-2 text-sm font-semibold text-navy"><input type="checkbox" checked={form.isActive} onChange={(event) => update("isActive", event.target.checked)} className="accent-gold-500" />Visible on homepage</label>
        <div className="grid grid-cols-2 gap-3"><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save section"}</Button><Button type="button" variant="secondary" onClick={reset}><RotateCcw size={16} />Reset</Button></div>
      </form>
    </aside>
  </div>;
}
