// src/admin/pages/MessagesPage.tsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminApiError, messages as api, type AdminMessage } from "../lib/api";

export function MessagesPage() {
    const [data, setData] = useState<AdminMessage[]>([]);
    const [loading, setLoading] = useState(true);

    async function reload() {
        setLoading(true);
        try {
            const res = await api.list({ limit: 50 });
            setData(res.data);
        } catch (err) {
            toast.error(err instanceof AdminApiError ? err.message : "Could not load messages");
        } finally { setLoading(false); }
    }

    useEffect(() => { reload(); }, []);

    async function markRead(m: AdminMessage) {
        try {
            await api.markRead(m._id);
            setData((rows) => rows.map((r) => r._id === m._id ? { ...r, status: "read" } : r));
        } catch { toast.error("Update failed"); }
    }

    return (
        <div className="space-y-6">
            <h1 className="font-label text-2xl">Messages</h1>
            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
                data.length === 0 ? <p className="text-sm text-muted-foreground">No messages yet.</p> :
                    <ul className="space-y-3">
                        {data.map((m) => (
                            <li key={m._id} className={`rounded border p-4 ${m.status === "new" ? "border-foreground" : "border-border"}`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium">
                                            {m.type === "tip" && <span className="mr-2 rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">TIP</span>}
                                            {m.subject || "(no subject)"}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            From {m.name} &lt;{m.email}&gt; · {new Date(m.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    {m.status === "new" && (
                                        <button onClick={() => markRead(m)} className="text-xs text-blue-600 hover:underline">Mark read</button>
                                    )}
                                </div>
                                <p className="mt-3 whitespace-pre-line text-sm">{m.message}</p>
                            </li>
                        ))}
                    </ul>
            }
        </div>
    );
}