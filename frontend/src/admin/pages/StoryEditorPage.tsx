import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
    seoTitle: string;
    summary: string;
    content: string;
    author: string;
    imageUrl: string;
    imageCredit: string;
    sourceName: string;
    sourceUrl: string;
    category: string;
    region: "Karnataka" | "India" | "Global";
    city: string;
    companiesInput: string;
    tagsInput: string;
    // Funding
    fundingAmountINR: string;
    fundingAmountUSD: string;
    fundingRound: string;
    fundingInvestors: string;
    // Editorial Controls
    isSponsored: boolean;
    sponsorName: string;
    homepageSlot: "lead" | "top" | "none";
    breakingExpiresAt: string;
    // Status
    status: "draft" | "published";
    publishedAt: string;
    isFeatured: boolean;
    isBreaking: boolean;
}

const empty: FormState = {
    title: "", seoTitle: "", summary: "", content: "", author: "Staff",
    imageUrl: "", imageCredit: "", sourceName: "", sourceUrl: "", category: "",
    region: "India", city: "", companiesInput: "", tagsInput: "",
    fundingAmountINR: "", fundingAmountUSD: "", fundingRound: "", fundingInvestors: "",
    isSponsored: false, sponsorName: "", homepageSlot: "none", breakingExpiresAt: "",
    status: "draft", publishedAt: "", isFeatured: false, isBreaking: false,
};

function toLocalInput(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string | null {
    if (!local) return null;
    const d = new Date(local);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function storyToForm(s: AdminStory): FormState {
    return {
        title: s.title, seoTitle: s.seoTitle || "", summary: s.summary, content: s.content,
        author: s.author || "Staff", imageUrl: s.imageUrl, imageCredit: s.imageCredit,
        sourceName: s.sourceName, sourceUrl: s.sourceUrl, category: s.category,
        region: s.region || "India", city: s.city || "",
        companiesInput: s.companies.join(", "), tagsInput: s.tags.join(", "),
        fundingAmountINR: s.fundingDetails?.amountINR || "",
        fundingAmountUSD: s.fundingDetails?.amountUSD || "",
        fundingRound: s.fundingDetails?.round || "",
        fundingInvestors: s.fundingDetails?.investors?.join(", ") || "",
        isSponsored: s.isSponsored, sponsorName: s.sponsorName || "",
        homepageSlot: s.homepageSlot || "none", breakingExpiresAt: toLocalInput(s.breakingExpiresAt),
        status: s.status, publishedAt: toLocalInput(s.publishedAt),
        isFeatured: s.isFeatured, isBreaking: s.isBreaking,
    };
}

function parseArrayInput(input: string, max = 99): string[] {
    return Array.from(new Set(input.split(",").map((t) => t.trim()).filter(Boolean))).slice(0, max);
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

        const payload = {
            title: form.title.trim(),
            seoTitle: form.seoTitle.trim(),
            summary: form.summary.trim(),
            content: form.content.trim(),
            author: form.author.trim(),
            imageUrl: form.imageUrl.trim(),
            imageCredit: form.imageCredit.trim(),
            sourceName: form.sourceName.trim(),
            sourceUrl: form.sourceUrl.trim(),
            category: form.category,
            region: form.region,
            city: form.city.trim(),
            companies: parseArrayInput(form.companiesInput),
            tags: parseArrayInput(form.tagsInput, 8),
            fundingDetails: {
                amountINR: form.fundingAmountINR.trim(),
                amountUSD: form.fundingAmountUSD.trim(),
                round: form.fundingRound.trim(),
                investors: parseArrayInput(form.fundingInvestors),
            },
            isSponsored: form.isSponsored,
            sponsorName: form.sponsorName.trim(),
            homepageSlot: form.homepageSlot,

            // 👇 SEND UNDEFINED IF BLANK SO THE BACKEND DEFAULTS TO CURRENT TIME
            breakingExpiresAt: form.breakingExpiresAt ? fromLocalInput(form.breakingExpiresAt) : undefined,
            publishedAt: form.publishedAt ? fromLocalInput(form.publishedAt) : undefined,

            status: form.status,
            isFeatured: form.isFeatured,
            isBreaking: form.isBreaking,
        };

        try {
            if (isEdit && id) {
                await storiesApi.update(id, payload as any);
                toast.success("Story updated");
            } else {
                await storiesApi.create(payload as any);
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

    if (loading) return <p className="text-sm text-muted-foreground">Loading story…</p>;

    return (
        <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-8 pb-24">
            <div className="flex items-center justify-between">
                <h1 className="font-label text-2xl">{isEdit ? "Edit story" : "New story"}</h1>
                <button type="button" onClick={() => navigate("/admin/stories")} className="text-sm text-muted-foreground hover:text-foreground">
                    Cancel
                </button>
            </div>

            {/* Link preview auto-fill */}
            <section className="rounded-lg border border-border bg-muted/20 p-5">
                <label className="text-sm font-semibold">Auto-fill from source URL (optional)</label>
                <div className="mt-2 flex gap-2">
                    <input type="url" placeholder="https://techcrunch.com/..." value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)}
                        className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm" />
                    <button type="button" onClick={onAutoFill} disabled={linkBusy || !previewUrl.trim()} className="rounded border border-border bg-background px-4 py-2 text-sm font-medium disabled:opacity-50">
                        {linkBusy ? "Fetching…" : "Fetch Data"}
                    </button>
                </div>
            </section>

            {/* CORE CONTENT */}
            <section className="space-y-4">
                <h2 className="border-b border-border pb-2 font-label text-lg">Core Content</h2>
                <Field id="title" label="Headline" error={errors.title} hint="10–180 characters">
                    <input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                </Field>
                <Field id="seoTitle" label="SEO Headline (Optional)" hint="Overrides the headline in Google search results">
                    <input id="seoTitle" value={form.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                </Field>

                <Field id="summary" label="Summary" error={errors.summary} hint="40–500 characters">
                    <div className="relative mt-1">
                        <textarea
                            id="summary"
                            rows={3}
                            maxLength={500}
                            value={form.summary}
                            onChange={(e) => update("summary", e.target.value)}
                            className="w-full rounded border border-border bg-background px-3 py-2 pb-6"
                        />
                        <span className={cn(
                            "absolute bottom-2 right-3 text-[10px] font-semibold",
                            form.summary.length > 450 ? "text-amber-500" : "text-muted-foreground",
                            form.summary.length === 500 ? "text-red-500" : ""
                        )}>
                            {form.summary.length} / 500
                        </span>
                    </div>
                </Field>

                <Field id="content" label="Content (Optional)" hint="Up to 5000 characters">
                    <textarea id="content" rows={6} value={form.content} onChange={(e) => update("content", e.target.value)} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                </Field>
            </section>

            {/* MEDIA */}
            <section className="space-y-4 rounded-lg border border-border p-5">
                <h2 className="font-label text-lg">Media</h2>
                {form.imageUrl && <img src={form.imageUrl} alt="" className="h-40 w-full rounded object-cover" />}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <input value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} placeholder="https://... (Image URL)"
                        className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm" />
                    <label className="cursor-pointer rounded border border-border bg-background px-4 py-2 text-center text-sm font-medium">
                        {uploading ? "Uploading…" : "Upload Image"}
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} disabled={uploading} className="hidden" />
                    </label>
                </div>
                {errors.imageUrl && <p className="text-xs text-signal">{errors.imageUrl}</p>}
                <input value={form.imageCredit} onChange={(e) => update("imageCredit", e.target.value)} placeholder="Image credit (e.g. Photo: Unsplash)"
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </section>

            {/* METADATA & TAXONOMY */}
            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field id="sourceName" label="Source Name" error={errors.sourceName}>
                    <input id="sourceName" value={form.sourceName} onChange={(e) => update("sourceName", e.target.value)} placeholder="TechCrunch" className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                </Field>
                <Field id="sourceUrl" label="Source URL" error={errors.sourceUrl}>
                    <input id="sourceUrl" value={form.sourceUrl} onChange={(e) => update("sourceUrl", e.target.value)} placeholder="https://..." className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                </Field>
                <Field id="author" label="Author / Desk">
                    <input id="author" value={form.author} onChange={(e) => update("author", e.target.value)} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                </Field>
                <Field id="category" label="Category" error={errors.category}>
                    <select id="category" value={form.category} onChange={(e) => update("category", e.target.value)} className="mt-1 w-full rounded border border-border bg-background px-3 py-2">
                        {categories.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}
                    </select>
                </Field>
                <Field id="tags" label="Tags" hint="Comma-separated, max 8">
                    <input id="tags" value={form.tagsInput} onChange={(e) => update("tagsInput", e.target.value)} placeholder="funding, robotics" className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                </Field>
                <Field id="companies" label="Companies Mentioned" hint="Comma-separated">
                    <input id="companies" value={form.companiesInput} onChange={(e) => update("companiesInput", e.target.value)} placeholder="Acme Robotics, Beta Inc" className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                </Field>
            </section>

            {/* REGIONAL DATA */}
            <section className="grid grid-cols-1 gap-6 rounded-lg border border-border bg-muted/10 p-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <h2 className="font-label text-lg">Regional Targeting</h2>
                    <p className="text-sm text-muted-foreground">Used for the "Karnataka · India · Global" header switcher.</p>
                </div>
                <Field id="region" label="Region">
                    <select id="region" value={form.region} onChange={(e) => update("region", e.target.value as any)} className="mt-1 w-full rounded border border-border bg-background px-3 py-2">
                        <option value="Karnataka">Karnataka</option>
                        <option value="India">India</option>
                        <option value="Global">Global</option>
                    </select>
                </Field>
                <Field id="city" label="City (Optional)">
                    <input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Bengaluru" className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                </Field>
            </section>

            {/* FUNDING DATA */}
            <section className="grid grid-cols-1 gap-6 rounded-lg border border-border bg-muted/10 p-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <h2 className="font-label text-lg">Funding Details (Optional)</h2>
                    <p className="text-sm text-muted-foreground">Populating this will automatically add the story to the Funding Tracker.</p>
                </div>
                <Field id="fundingRound" label="Round">
                    <input id="fundingRound" value={form.fundingRound} onChange={(e) => update("fundingRound", e.target.value)} placeholder="Series A" className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field id="fundingAmountINR" label="Amount (₹)">
                        <input id="fundingAmountINR" value={form.fundingAmountINR} onChange={(e) => update("fundingAmountINR", e.target.value)} placeholder="12 Crore" className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                    </Field>
                    <Field id="fundingAmountUSD" label="Amount ($)">
                        <input id="fundingAmountUSD" value={form.fundingAmountUSD} onChange={(e) => update("fundingAmountUSD", e.target.value)} placeholder="$1.5M" className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                    </Field>
                </div>
                <Field id="fundingInvestors" label="Lead Investors" hint="Comma-separated" >
                    <input id="fundingInvestors" value={form.fundingInvestors} onChange={(e) => update("fundingInvestors", e.target.value)} placeholder="Sequoia, Accel" className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                </Field>
            </section>

            {/* EDITORIAL CONTROLS */}
            <section className="grid grid-cols-1 gap-6 rounded-lg border border-border bg-muted/10 p-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <h2 className="font-label text-lg">Editorial Controls</h2>
                </div>
                <Field id="homepageSlot" label="Homepage Slot">
                    <select id="homepageSlot" value={form.homepageSlot} onChange={(e) => update("homepageSlot", e.target.value as any)} className="mt-1 w-full rounded border border-border bg-background px-3 py-2">
                        <option value="none">None (Default)</option>
                        <option value="lead">Lead Story (Main Hero)</option>
                        <option value="top">Top Stories Column</option>
                    </select>
                </Field>

                <div className="space-y-3 rounded border border-border p-3">
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.isSponsored} onChange={(e) => update("isSponsored", e.target.checked)} />
                        Sponsored Post
                    </label>
                    {form.isSponsored && (
                        <input value={form.sponsorName} onChange={(e) => update("sponsorName", e.target.value)} placeholder="Sponsor Name" className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm" />
                    )}
                </div>

                <Field id="publishedAt" label="Publish Date/Time" hint="Leave blank for now. Future = scheduled.">
                    <input id="publishedAt" type="datetime-local" value={form.publishedAt} onChange={(e) => update("publishedAt", e.target.value)} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                </Field>

                <Field id="status" label="Status">
                    <select id="status" value={form.status} onChange={(e) => update("status", e.target.value as any)} className="mt-1 w-full rounded border border-border bg-background px-3 py-2">
                        <option value="draft">Draft (hidden)</option>
                        <option value="published">Published (live)</option>
                    </select>
                </Field>

                <Field id="breakingExpiresAt" label="Breaking Expiry" hint="Stop showing in ticker after this time">
                    <input id="breakingExpiresAt" type="datetime-local" value={form.breakingExpiresAt} onChange={(e) => update("breakingExpiresAt", e.target.value)} className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                </Field>
            </section>

            {/* FLAGS */}
            <div className="flex gap-6 rounded-lg border border-border p-5">
                <label className="flex items-center gap-2 text-sm font-medium">
                    <input type="checkbox" checked={form.isFeatured} onChange={(e) => update("isFeatured", e.target.checked)} />
                    Featured (Hero fallback)
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                    <input type="checkbox" checked={form.isBreaking} onChange={(e) => update("isBreaking", e.target.checked)} />
                    Breaking News
                </label>
            </div>

            <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="mx-auto flex max-w-4xl justify-end gap-3">
                    <button type="button" onClick={() => navigate("/admin/stories")} className="rounded border border-border px-4 py-2 text-sm font-medium">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className="rounded bg-foreground px-6 py-2 text-sm font-medium text-background disabled:opacity-60">
                        {saving ? "Saving…" : isEdit ? "Update story" : "Create story"}
                    </button>
                </div>
            </div>
        </form>
    );
}

function Field({ id, label, error, hint, children }: {
    id: string; label: string; error?: string; hint?: string; children: React.ReactNode;
}) {
    return (
        <div>
            <label htmlFor={id} className="text-sm font-semibold">{label}</label>
            {children}
            {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
            {error && <p className="mt-1 text-xs text-signal">{error}</p>}
        </div>
    );
}