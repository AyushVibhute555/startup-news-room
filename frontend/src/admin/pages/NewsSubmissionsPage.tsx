import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
    adminErrorMessage,
    categories as categoriesApi,
    newsSubmissions as submissionsApi,
    type AdminCategory,
    type AdminNewsSubmission,
    type PublishNewsSubmissionPayload,
} from "../lib/api";

type SubmissionStatus = AdminNewsSubmission["status"];
type ReviewFields = Pick<AdminNewsSubmission, "title" | "summary" | "content" | "author" | "imageUrl" | "imageCredit" | "category"> & {
    publishedAt: string;
};

function toLocalInput(date: string | null): string {
    if (!date) return "";
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return "";
    const pad = (part: number) => String(part).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function submissionToFields(submission: AdminNewsSubmission): ReviewFields {
    return {
        title: submission.title,
        summary: submission.summary,
        content: submission.content,
        author: submission.author || submission.submitterName,
        imageUrl: submission.imageUrl,
        imageCredit: submission.imageCredit || "",
        category: submission.category,
        publishedAt: toLocalInput(submission.publishedAt),
    };
}

export function NewsSubmissionsPage() {
    const [status, setStatus] = useState<SubmissionStatus>("pending");
    const [page, setPage] = useState(1);
    const [items, setItems] = useState<AdminNewsSubmission[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [fields, setFields] = useState<ReviewFields | null>(null);
    const [categories, setCategories] = useState<AdminCategory[]>([]);
    const [categoryError, setCategoryError] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [busy, setBusy] = useState(false);

    const reload = useCallback(async () => {
        setLoading(true);
        setLoadError(false);
        try {
            const result = await submissionsApi.list(status, page);
            setItems(result.data);
            setTotalPages(result.pagination.totalPages);
        } catch (error) {
            setLoadError(true);
            toast.error(adminErrorMessage(error, "Could not load news submissions"));
        } finally {
            setLoading(false);
        }
    }, [status, page]);

    const loadCategories = useCallback(async () => {
        setCategoryError(false);
        try {
            setCategories(await categoriesApi.list());
        } catch (error) {
            setCategoryError(true);
            toast.error(adminErrorMessage(error, "Could not load categories"));
        }
    }, []);

    useEffect(() => {
        void reload();
    }, [reload]);

    useEffect(() => {
        void loadCategories();
    }, [loadCategories]);

    function selectSubmission(submission: AdminNewsSubmission) {
        setSelectedId(submission._id);
        setFields(submissionToFields(submission));
        setRejectionReason("");
    }

    function update<K extends keyof ReviewFields>(key: K, value: ReviewFields[K]) {
        setFields((current) => current ? { ...current, [key]: value } : current);
    }

    async function publish() {
        if (!selectedId || !fields) return;
        const newsDate = fields.publishedAt ? new Date(fields.publishedAt) : undefined;
        if (newsDate && Number.isNaN(newsDate.getTime())) {
            toast.error("Enter a valid news date and time.");
            return;
        }
        const payload: PublishNewsSubmissionPayload = {
            title: fields.title.trim(),
            summary: fields.summary.trim(),
            content: fields.content.trim(),
            imageUrl: fields.imageUrl.trim(),
            imageCredit: fields.imageCredit.trim(),
            category: fields.category,
        };
        if (fields.author.trim()) payload.author = fields.author.trim();
        payload.publishedAt = newsDate ? newsDate.toISOString() : null;

        setBusy(true);
        try {
            await submissionsApi.publish(selectedId, payload);
            toast.success("News published");
            setSelectedId(null);
            setFields(null);
            await reload();
        } catch (error) {
            toast.error(adminErrorMessage(error, "Could not publish news"));
        } finally {
            setBusy(false);
        }
    }

    async function reject() {
        if (!selectedId || !window.confirm("Reject this submission?")) return;
        setBusy(true);
        try {
            await submissionsApi.reject(selectedId, rejectionReason.trim());
            toast.success("Submission rejected");
            setSelectedId(null);
            setFields(null);
            await reload();
        } catch (error) {
            toast.error(adminErrorMessage(error, "Could not reject submission"));
        } finally {
            setBusy(false);
        }
    }

    const selected = items.find((item) => item._id === selectedId);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-label text-2xl">Community news submissions</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Review stories before publishing them on the website.</p>
                </div>
                <select
                    value={status}
                    onChange={(event) => {
                        setPage(1);
                        setStatus(event.target.value as SubmissionStatus);
                        setSelectedId(null);
                        setFields(null);
                    }}
                    className="rounded border border-border bg-background px-3 py-2 text-sm"
                    aria-label="Filter submissions by status"
                >
                    <option value="pending">Pending</option>
                    <option value="published">Published</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {categoryError && (
                <div role="alert" className="rounded border border-signal/40 bg-signal/5 p-3 text-sm">
                    Could not load categories. <button type="button" className="underline" onClick={() => void loadCategories()}>Retry</button>
                </div>
            )}

            {loading ? (
                <p className="text-sm text-muted-foreground">Loading submissions…</p>
            ) : loadError ? (
                <p role="alert" className="rounded border border-border p-6 text-sm">
                    Could not load submissions. <button type="button" className="underline" onClick={() => void reload()}>Retry</button>
                </p>
            ) : items.length === 0 ? (
                <p className="rounded border border-border p-6 text-sm text-muted-foreground">No {status} submissions.</p>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.8fr)]">
                    <ul className="space-y-2">
                        {items.map((item) => (
                            <li key={item._id}>
                                <button
                                    type="button"
                                    onClick={() => selectSubmission(item)}
                                    className={`w-full rounded border p-4 text-left ${selectedId === item._id ? "border-foreground" : "border-border hover:border-muted-foreground"}`}
                                >
                                    <span className="block font-medium">{item.title}</span>
                                    <span className="mt-1 block text-xs text-muted-foreground">
                                        {item.submitterName} · {new Date(item.createdAt).toLocaleString()}
                                    </span>
                                    <span className="mt-2 block text-xs capitalize text-muted-foreground">{item.category} · {item.status}</span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    {selected && fields ? (
                        <section className="space-y-5 rounded border border-border p-5">
                            <div>
                                <h2 className="font-label text-xl">Review submission</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Submitted by {selected.submitterName} · <a className="underline" href={`mailto:${selected.submitterEmail}`}>{selected.submitterEmail}</a>
                                </p>
                            </div>

                            {fields.imageUrl && <img src={fields.imageUrl} alt="" className="max-h-64 w-full rounded object-contain" />}

                            <label className="block text-sm font-medium">
                                Headline
                                <input value={fields.title} onChange={(event) => update("title", event.target.value)} maxLength={180} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                            </label>
                            <label className="block text-sm font-medium">
                                Subheading
                                <textarea value={fields.summary} onChange={(event) => update("summary", event.target.value)} maxLength={500} rows={3} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                            </label>
                            <label className="block text-sm font-medium">
                                News article
                                <textarea value={fields.content} onChange={(event) => update("content", event.target.value)} maxLength={50000} rows={12} className="mt-1 w-full rounded border border-border bg-background px-3 py-2 font-mono text-sm" />
                            </label>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block text-sm font-medium">
                                    Article author
                                    <input value={fields.author} onChange={(event) => update("author", event.target.value)} maxLength={120} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                                </label>
                                <label className="block text-sm font-medium">
                                    Category
                                    <select value={fields.category} onChange={(event) => update("category", event.target.value)} disabled={categoryError} className="mt-1 w-full rounded border border-border bg-background px-3 py-2">
                                        {categories.map((category) => <option key={category._id} value={category.slug}>{category.name}</option>)}
                                    </select>
                                </label>
                            </div>
                            <label className="block text-sm font-medium">
                                Image URL
                                <input type="url" value={fields.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                            </label>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block text-sm font-medium">
                                    Image credit
                                    <input value={fields.imageCredit} onChange={(event) => update("imageCredit", event.target.value)} maxLength={200} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                                </label>
                                <label className="block text-sm font-medium">
                                    News date/time
                                    <input type="datetime-local" value={fields.publishedAt} onChange={(event) => update("publishedAt", event.target.value)} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                                </label>
                            </div>

                            {status === "pending" ? (
                                <div className="space-y-3 border-t border-border pt-4">
                                    <label className="block text-sm font-medium">
                                        Rejection reason (optional)
                                        <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} maxLength={500} rows={2} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                                    </label>
                                    <div className="flex flex-wrap justify-end gap-3">
                                        <button type="button" onClick={reject} disabled={busy} className="rounded border border-border px-4 py-2 text-sm disabled:opacity-50">
                                            Reject
                                        </button>
                                        <button type="button" onClick={publish} disabled={busy || categoryError} className="rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50">
                                            {busy ? "Saving…" : "Publish"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="border-t border-border pt-4 text-sm text-muted-foreground">
                                    {status === "published" ? `Published on ${selected.reviewedAt ? new Date(selected.reviewedAt).toLocaleString() : "—"}.` : `Rejected${selected.rejectionReason ? `: ${selected.rejectionReason}` : "."}`}
                                </p>
                            )}
                        </section>
                    ) : (
                        <p className="rounded border border-border p-6 text-sm text-muted-foreground">Select a submission to review.</p>
                    )}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => { setSelectedId(null); setFields(null); setPage((value) => Math.max(1, value - 1)); }} disabled={page <= 1} className="rounded border border-border px-3 py-1 disabled:opacity-40">Previous</button>
                        <button type="button" onClick={() => { setSelectedId(null); setFields(null); setPage((value) => Math.min(totalPages, value + 1)); }} disabled={page >= totalPages} className="rounded border border-border px-3 py-1 disabled:opacity-40">Next</button>
                    </div>
                </div>
            )}
        </div>
    );
}
