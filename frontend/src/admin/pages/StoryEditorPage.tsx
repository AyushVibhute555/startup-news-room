// src/admin/pages/StoryEditorPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
    AdminApiError,
    categories as categoriesApi,
    linkPreview as linkPreviewApi,
    stories as storiesApi,
    uploads,
    type AdminCategory,
    type AdminStory,
} from "../lib/api";

interface FormState {
    title: string;
    summary: string;
    content: string;
    imageUrl: string;
    imageCredit: string;
    sourceName: string;
    sourceUrl: string;
    category: string;
    tagsInput: string;
    status: "draft" | "published";
    publishedAt: string; // datetime-local or ""
    isFeatured: boolean;
    isBreaking: boolean;
}

const empty: FormState = {
    title: "", summary: "", content: "", imageUrl: "", imageCredit: "",
    sourceName: "", sourceUrl: "", category: "",
    tagsInput: "", status: "draft", publishedAt: "",
    isFeatured: false, isBreaking: false,
};

function toLocalInput(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string | undefined {
    if (!local) return undefined;
    const d = new Date(local);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function storyToForm(s: AdminStory): FormState {
    return {
        title: s.title, summary: s.summary, content: s.content,
        imageUrl: s.imageUrl, imageCredit: s.imageCredit,
        sourceName: s.sourceName, sourceUrl: s.sourceUrl,
        category: s.category, tagsInput: s.tags.join(", "),
        status: s.status, publishedAt: s.publishedAt ? toLocalInput(s.publishedAt) : "",
        isFeatured: s.isFeatured, isBreaking: s.isBreaking,
    };
}

function parseTags(input: string): string[] {
    return Array.from(
        new Set(
            input.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
        ),
    ).slice(0, 8);
}

export function StoryEditorPage() {
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    const [form, setForm] = useState<FormState>(empty);
    const [categories, setCategories] = useState<AdminCategory[]>([]);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [linkBusy, setLinkBusy] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        categoriesApi.list().then((cs) => {
            setCategories(cs);
            setForm((f) => (f.category ? f : { ...f, category: cs[0]?.slug ?? "" }));
        }).catch(() => toast.error("Could not load categories"));
    }, []);

    useEffect(() => {
        if (!isEdit || !id) return;
        setLoading(true);
        storiesApi.list({ limit: 100 }).then((res) => {
            const story = res.data.find((s) => s._id === id);
            if (!story) { toast.error("Story not found"); navigate("/admin/stories"); return; }
            setForm(storyToForm(story));
        }).catch((err) => toast.error(err instanceof AdminApiError ? err.message : "Could not load story"))
            .finally(() => setLoading(false));
    }, [id, isEdit, navigate]);

    function update<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    function validate(): boolean {
        const e: Record<string, string> = {};
        const t = form.title.trim(), s = form.summary.trim();
        if (t.length < 10) e.title = "At least 10 characters";
        if (t.length > 180) e.title = "At most 180 characters";
        if (s.length < 40) e.summary = "At least 40 characters";
        if (s.length > 500) e.summary = "At most 500 characters";
        if (form.content.length > 5000) e.content = "At most 5000 characters";
        if (!form.imageUrl.startsWith("https://")) e.imageUrl = "Must be an https:// URL";
        if (!form.sourceName.trim()) e.sourceName = "Required";
        if (!/^https?:\/\//i.test(form.sourceUrl)) e.sourceUrl = "Must start with http(s)://";
        if (!form.category) e.category = "Choose a category";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            const payload = {
                title: form.title.trim(),
                summary: form.summary.trim(),
                content: form.content.trim(),
                imageUrl: form.imageUrl.trim(),
                imageCredit: form.imageCredit.trim(),
                sourceName: form.sourceName.trim(),
                sourceUrl: form.sourceUrl.trim(),
                category: form.category,
                tags: parseTags(form.tagsInput),
                status: form.status,
                publishedAt: fromLocalInput(form.publishedAt),
                isFeatured: form.isFeatured,
                isBreaking: form.isBreaking,
            };
            if (isEdit && id) {
                await storiesApi.update(id, payload);
                toast.success("Story updated");
            } else {
                await storiesApi.create(payload);
                toast.success("Story created");
            }
            navigate("/admin/stories");
        } catch (err) {
            toast.error(err instanceof AdminApiError ? err.message : "Save failed");
        } finally {
            setSaving(false);
        }
    }

    async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const result = await uploads.image(file);
            update("imageUrl", result.url);
            toast.success("Image uploaded");
        } catch (err) {
            toast.error(err instanceof AdminApiError ? err.message : "Upload failed");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    }

    async function onAutoFill() {
        if (!previewUrl.trim()) return;
        setLinkBusy(true);
        try {
            const preview = await linkPreviewApi.fetch(previewUrl.trim());
            setForm((f) => ({
                ...f,
                title: preview.title || f.title,
                summary: preview.description || f.summary,
                imageUrl: preview.imageUrl || f.imageUrl,
                sourceName: preview.siteName || f.sourceName,
                sourceUrl: f.sourceUrl || previewUrl.trim(),
            }));
            toast.success("Form filled from source");
        } catch (err) {
            toast.error(err instanceof AdminApiError ? err.message : "Could not fetch link");
        } finally {
            setLinkBusy(false);
        }
    }

    if (loading) {
        return <p className="text-sm text-muted-foreground">Loading story…</p>;
    }

    return (
        <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="font-label text-2xl">{isEdit ? "Edit story" : "New story"}</h1>
                <button type="button" onClick={() => navigate("/admin/stories")} className="text-sm text-muted-foreground hover:text-foreground">
                    Cancel
                </button>
            </div>

            {/* Link preview auto-fill */}
            <section className="rounded border border-border p-4">
                <label className="text-sm font-medium">Auto-fill from source URL (optional)</label>
                <div className="mt-2 flex gap-2">
                    <input
                        type="url"
                        placeholder="https://techcrunch.com/..."
                        value={previewUrl}
                        onChange={(e) => setPreviewUrl(e.target.value)}
                        className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm"
                    />
                    <button
                        type="button"
                        onClick={onAutoFill}
                        disabled={linkBusy || !previewUrl.trim()}
                        className="rounded border border-border px-3 py-2 text-sm disabled:opacity-50"
                    >
                        {linkBusy ? "Fetching…" : "Fetch"}
                    </button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                    Extracts title, summary, image and source name from the publisher's Open Graph tags.
                </p>
            </section>

            {/* Title + Summary */}
            <Field id="title" label="Title" error={errors.title}>
                <input id="title" value={form.title} onChange={(e) => update("title", e.target.value)}
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
            </Field>

            <Field id="summary" label="Summary" error={errors.summary} hint="40–500 characters, plain text">
                <textarea id="summary" rows={3} value={form.summary} onChange={(e) => update("summary", e.target.value)}
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
            </Field>

            <Field id="content" label="Content (optional)" error={errors.content} hint="Up to 5000 characters">
                <textarea id="content" rows={6} value={form.content} onChange={(e) => update("content", e.target.value)}
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
            </Field>

            {/* Image */}
            <section className="space-y-3 rounded border border-border p-4">
                <label className="text-sm font-medium">Image</label>
                {form.imageUrl && (
                    <img src={form.imageUrl} alt="" className="h-40 w-full rounded object-cover" />
                )}
                <input
                    value={form.imageUrl}
                    onChange={(e) => update("imageUrl", e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                />
                {errors.imageUrl && <p className="text-xs text-signal">{errors.imageUrl}</p>}
                <div className="flex items-center gap-3">
                    <label className="cursor-pointer rounded border border-border px-3 py-1.5 text-sm">
                        {uploading ? "Uploading…" : "Upload file"}
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} disabled={uploading} className="hidden" />
                    </label>
                    <input
                        value={form.imageCredit}
                        onChange={(e) => update("imageCredit", e.target.value)}
                        placeholder="Image credit (e.g. Photo: Unsplash)"
                        className="flex-1 rounded border border-border bg-background px-3 py-1.5 text-sm"
                    />
                </div>
            </section>

            {/* Source */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="sourceName" label="Source name" error={errors.sourceName}>
                    <input id="sourceName" value={form.sourceName} onChange={(e) => update("sourceName", e.target.value)}
                        placeholder="TechCrunch"
                        className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                </Field>
                <Field id="sourceUrl" label="Source URL" error={errors.sourceUrl}>
                    <input id="sourceUrl" value={form.sourceUrl} onChange={(e) => update("sourceUrl", e.target.value)}
                        placeholder="https://..."
                        className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                </Field>
            </div>

            {/* Category + Tags */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="category" label="Category" error={errors.category}>
                    <select id="category" value={form.category} onChange={(e) => update("category", e.target.value)}
                        className="mt-1 w-full rounded border border-border bg-background px-3 py-2">
                        {categories.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}
                    </select>
                </Field>
                <Field id="tags" label="Tags" hint="Comma-separated, max 8">
                    <input id="tags" value={form.tagsInput} onChange={(e) => update("tagsInput", e.target.value)}
                        placeholder="funding, robotics, series-b"
                        className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                </Field>
            </div>

            {/* Status + Published date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="status" label="Status">
                    <select id="status" value={form.status} onChange={(e) => update("status", e.target.value as "draft" | "published")}
                        className="mt-1 w-full rounded border border-border bg-background px-3 py-2">
                        <option value="draft">Draft (hidden)</option>
                        <option value="published">Published (live)</option>
                    </select>
                </Field>
                <Field id="publishedAt" label="Publish date/time" hint="Leave blank for now. Future = scheduled.">
                    <input id="publishedAt" type="datetime-local" value={form.publishedAt}
                        onChange={(e) => update("publishedAt", e.target.value)}
                        className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                </Field>
            </div>

            {/* Flags */}
            <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isFeatured} onChange={(e) => update("isFeatured", e.target.checked)} />
                    Featured (replaces current featured)
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isBreaking} onChange={(e) => update("isBreaking", e.target.checked)} />
                    Breaking news
                </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button type="button" onClick={() => navigate("/admin/stories")} className="rounded border border-border px-4 py-2 text-sm">
                    Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-60">
                    {saving ? "Saving…" : isEdit ? "Update story" : "Create story"}
                </button>
            </div>
        </form>
    );
}

function Field({ id, label, error, hint, children }: {
    id: string; label: string; error?: string; hint?: string; children: React.ReactNode;
}) {
    return (
        <div>
            <label htmlFor={id} className="text-sm font-medium">{label}</label>
            {children}
            {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
            {error && <p className="mt-1 text-xs text-signal">{error}</p>}
        </div>
    );
}