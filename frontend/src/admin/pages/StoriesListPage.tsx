// src/admin/pages/StoriesListPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { stories as storiesApi, type AdminStory, type AdminCategory, categories as categoriesApi, AdminApiError } from "../lib/api";

const PAGE_LIMIT = 20;

export function StoriesListPage() {
    const [data, setData] = useState<AdminStory[]>([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1, hasMore: false });
    const [categories, setCategories] = useState<AdminCategory[]>([]);
    const [status, setStatus] = useState<"" | "draft" | "published">("");
    const [category, setCategory] = useState("");
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    useEffect(() => {
        categoriesApi.list().then(setCategories).catch(() => undefined);
    }, []);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        storiesApi
            .list({ status: status || undefined, category: category || undefined, q: q || undefined, page, limit: PAGE_LIMIT })
            .then((res) => {
                if (!alive) return;
                setData(res.data);
                setPagination(res.pagination);
            })
            .catch((err) => {
                toast.error(err instanceof AdminApiError ? err.message : "Could not load stories");
            })
            .finally(() => alive && setLoading(false));
        return () => { alive = false; };
    }, [status, category, q, page]);

    async function onDelete(story: AdminStory) {
        if (!confirm(`Delete "${story.title}"? This cannot be undone.`)) return;
        setBusyId(story._id);
        try {
            await storiesApi.remove(story._id);
            toast.success("Story deleted");
            // refresh
            const res = await storiesApi.list({ status: status || undefined, category: category || undefined, q: q || undefined, page, limit: PAGE_LIMIT });
            setData(res.data);
            setPagination(res.pagination);
        } catch (err) {
            toast.error(err instanceof AdminApiError ? err.message : "Delete failed");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="font-label text-2xl">Stories</h1>
                <Link
                    to="/admin/stories/new"
                    className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
                >
                    + New story
                </Link>
            </div>

            <div className="flex flex-wrap gap-3">
                <select
                    value={status}
                    onChange={(e) => { setPage(1); setStatus(e.target.value as typeof status); }}
                    className="rounded border border-border bg-background px-3 py-2 text-sm"
                >
                    <option value="">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                </select>
                <select
                    value={category}
                    onChange={(e) => { setPage(1); setCategory(e.target.value); }}
                    className="rounded border border-border bg-background px-3 py-2 text-sm"
                >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                        <option key={c._id} value={c.slug}>{c.name}</option>
                    ))}
                </select>
                <input
                    type="search"
                    placeholder="Search…"
                    value={q}
                    onChange={(e) => { setPage(1); setQ(e.target.value); }}
                    className="flex-1 min-w-[200px] rounded border border-border bg-background px-3 py-2 text-sm"
                />
            </div>

            <div className="rounded border border-border">
                {loading && data.length === 0 ? (
                    <p className="p-6 text-sm text-muted-foreground">Loading…</p>
                ) : data.length === 0 ? (
                    <p className="p-6 text-sm text-muted-foreground">No stories found.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/40">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium">Title</th>
                                <th className="px-3 py-2 text-left font-medium">Category</th>
                                <th className="px-3 py-2 text-left font-medium">Status</th>
                                <th className="px-3 py-2 text-left font-medium">Published</th>
                                <th className="px-3 py-2 text-left font-medium">Flags</th>
                                <th className="px-3 py-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((s) => (
                                <tr key={s._id} className="border-b border-border last:border-0">
                                    <td className="px-3 py-3">
                                        <Link to={`/admin/stories/${s._id}/edit`} className="hover:underline">
                                            {s.title}
                                        </Link>
                                    </td>
                                    <td className="px-3 py-3 capitalize">{s.category}</td>
                                    <td className="px-3 py-3">
                                        <span className={`rounded px-2 py-0.5 text-xs ${s.status === "published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-xs text-muted-foreground">
                                        {new Date(s.publishedAt).toLocaleString()}
                                    </td>
                                    <td className="px-3 py-3 text-xs">
                                        {s.isFeatured && <span className="mr-1 rounded bg-blue-100 px-1.5 py-0.5 text-blue-800">F</span>}
                                        {s.isBreaking && <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-800">B</span>}
                                    </td>
                                    <td className="px-3 py-3 text-right">
                                        <Link to={`/admin/stories/${s._id}/edit`} className="mr-3 text-xs text-blue-600 hover:underline">
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => onDelete(s)}
                                            disabled={busyId === s._id}
                                            className="text-xs text-signal hover:underline disabled:opacity-50"
                                        >
                                            {busyId === s._id ? "…" : "Delete"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={pagination.page <= 1}
                            className="rounded border border-border px-3 py-1 disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={!pagination.hasMore}
                            className="rounded border border-border px-3 py-1 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}