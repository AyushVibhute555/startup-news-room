// src/admin/pages/CategoriesPage.tsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminApiError, categories as api, type AdminCategory } from "../lib/api";

export function CategoriesPage() {
    const [data, setData] = useState<AdminCategory[]>([]);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");

    async function reload() { setData(await api.list()); }
    useEffect(() => { reload().catch(() => toast.error("Could not load categories")); }, []);

    async function onCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !slug.trim()) return;
        try {
            await api.create({ name: name.trim(), slug: slug.trim().toLowerCase() });
            setName(""); setSlug("");
            toast.success("Category created");
            await reload();
        } catch (err) { toast.error(err instanceof AdminApiError ? err.message : "Create failed"); }
    }

    async function onDelete(c: AdminCategory) {
        if (!confirm(`Delete "${c.name}"?`)) return;
        try {
            await api.remove(c._id);
            toast.success("Category deleted");
            await reload();
        } catch (err) { toast.error(err instanceof AdminApiError ? err.message : "Delete failed"); }
    }

    return (
        <div className="space-y-6">
            <h1 className="font-label text-2xl">Categories</h1>
            <form onSubmit={onCreate} className="flex gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
                    className="rounded border border-border bg-background px-3 py-2 text-sm" />
                <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug"
                    className="rounded border border-border bg-background px-3 py-2 text-sm" />
                <button type="submit" className="rounded bg-foreground px-4 py-2 text-sm text-background">Add</button>
            </form>
            <div className="rounded border border-border">
                <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/40">
                        <tr>
                            <th className="px-3 py-2 text-left">Name</th>
                            <th className="px-3 py-2 text-left">Slug</th>
                            <th className="px-3 py-2 text-left">Order</th>
                            <th className="px-3 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((c) => (
                            <tr key={c._id} className="border-b border-border last:border-0">
                                <td className="px-3 py-2">{c.name}</td>
                                <td className="px-3 py-2 text-muted-foreground">{c.slug}</td>
                                <td className="px-3 py-2">{c.order}</td>
                                <td className="px-3 py-2 text-right">
                                    <button onClick={() => onDelete(c)} className="text-xs text-signal hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}