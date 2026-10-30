// src/admin/pages/SubscribersPage.tsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminApiError, subscribers as api, type AdminSubscriber } from "../lib/api";

export function SubscribersPage() {
    const [data, setData] = useState<AdminSubscriber[]>([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        api.list({ limit: 100 })
            .then((res) => { setData(res.data); setTotal(res.pagination.total); })
            .catch((err) => toast.error(err instanceof AdminApiError ? err.message : "Load failed"));
    }, []);

    async function exportCsv() {
        try { await api.downloadCsv(); }
        catch { toast.error("Export failed"); }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="font-label text-2xl">Subscribers <span className="text-sm text-muted-foreground">({total})</span></h1>
                <button onClick={exportCsv} className="rounded border border-border px-3 py-1.5 text-sm">Download CSV</button>
            </div>
            <div className="rounded border border-border">
                <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/40">
                        <tr>
                            <th className="px-3 py-2 text-left">Email</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-left">Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((s) => (
                            <tr key={s._id} className="border-b border-border last:border-0">
                                <td className="px-3 py-2">{s.email}</td>
                                <td className="px-3 py-2">
                                    <span className={`rounded px-2 py-0.5 text-xs ${s.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                                        {s.status}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}