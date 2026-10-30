// src/admin/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

// ── Auth token (module-level, memory only — XSS-safe) ───────────────────
let currentToken: string | null = null;
export function setAuthToken(t: string | null) { currentToken = t; }
export function getAuthToken() { return currentToken; }

// ── Error type ──────────────────────────────────────────────────────────
export class AdminApiError extends Error {
    constructor(
        public status: number,
        public code: string,
        message: string,
        public details?: unknown,
    ) {
        super(message);
        this.name = "AdminApiError";
    }
}

// ── Wire types ──────────────────────────────────────────────────────────
export interface AdminUser {
    _id: string;
    name: string;
    email: string;
    role: "admin" | "editor";
}

export interface AdminStory {
    _id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    imageUrl: string;
    imageCredit: string;
    sourceName: string;
    sourceUrl: string;
    category: string;
    tags: string[];
    status: "draft" | "published";
    publishedAt: string;
    readTime: number;
    isFeatured: boolean;
    isBreaking: boolean;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AdminCategory {
    _id: string;
    name: string;
    slug: string;
    description: string;
    order: number;
}

export interface AdminMessage {
    _id: string;
    type: "contact" | "tip";
    name: string;
    email: string;
    subject: string;
    message: string;
    status: "new" | "read";
    ip: string;
    createdAt: string;
}

export interface AdminSubscriber {
    _id: string;
    email: string;
    status: "active" | "unsubscribed";
    source: string;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
}
interface Paginated<T> { data: T[]; pagination: Pagination; }
interface Envelope<T> { data: T; }
interface ErrorBody { error: { code: string; message: string; details?: unknown } }

// ── 401 → refresh → retry (deduplicated across concurrent calls) ────────
let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
    if (!refreshing) {
        refreshing = fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            credentials: "include",
        })
            .then(async (r) => {
                if (!r.ok) { setAuthToken(null); return false; }
                const body = (await r.json()) as Envelope<{ accessToken: string; user: AdminUser }>;
                setAuthToken(body.data.accessToken);
                return true;
            })
            .catch(() => { setAuthToken(null); return false; })
            .finally(() => { refreshing = null; });
    }
    return refreshing;
}

interface FetchOpts extends RequestInit {
    /** Skip Content-Type (used for FormData uploads). */
    raw?: boolean;
    /** Don't try to refresh on 401 (used for auth endpoints themselves). */
    noRefresh?: boolean;
}

async function adminFetch(path: string, opts: FetchOpts = {}): Promise<Response> {
    const { raw, noRefresh, ...init } = opts;

    const doFetch = () =>
        fetch(`${API_URL}${path}`, {
            ...init,
            credentials: "include",
            headers: {
                ...(raw ? {} : { "Content-Type": "application/json", Accept: "application/json" }),
                ...(init.headers ?? {}),
                ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
            },
        });

    let res = await doFetch();

    if (res.status === 401 && !noRefresh) {
        const ok = await tryRefresh();
        if (ok) res = await doFetch();
    }

    return res;
}

async function json<T>(res: Response): Promise<T> {
    if (!res.ok) {
        let body: ErrorBody | null = null;
        try { body = (await res.json()) as ErrorBody; } catch { /* non-JSON */ }
        throw new AdminApiError(
            res.status,
            body?.error.code ?? "UNKNOWN_ERROR",
            body?.error.message ?? `Request failed with ${res.status}`,
            body?.error.details,
        );
    }
    return (await res.json()) as T;
}

// ── Auth ────────────────────────────────────────────────────────────────
export const auth = {
    async login(email: string, password: string) {
        const res = await adminFetch("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
            noRefresh: true,
        });
        return (await json<Envelope<{ accessToken: string; user: AdminUser }>>(res)).data;
    },
    async logout() {
        const res = await adminFetch("/auth/logout", { method: "POST", noRefresh: true });
        return json<Envelope<{ loggedOut: true }>>(res);
    },
    async me() {
        const res = await adminFetch("/auth/me");
        return (await json<Envelope<{ user: AdminUser }>>(res)).data;
    },
    tryRefresh,
};

// ── Stories ─────────────────────────────────────────────────────────────
export interface ListStoriesParams {
    status?: "draft" | "published";
    category?: string;
    q?: string;
    page?: number;
    limit?: number;
}

export const stories = {
    async list(params: ListStoriesParams = {}): Promise<Paginated<AdminStory>> {
        const qs = new URLSearchParams();
        if (params.status) qs.set("status", params.status);
        if (params.category) qs.set("category", params.category);
        if (params.q) qs.set("q", params.q);
        if (params.page) qs.set("page", String(params.page));
        if (params.limit) qs.set("limit", String(params.limit));
        return json<Paginated<AdminStory>>(await adminFetch(`/admin/stories?${qs}`));
    },
    async create(payload: Partial<AdminStory>): Promise<AdminStory> {
        const res = await adminFetch("/admin/stories", {
            method: "POST",
            body: JSON.stringify(payload),
        });
        return (await json<Envelope<AdminStory>>(res)).data;
    },
    async update(id: string, payload: Partial<AdminStory>): Promise<AdminStory> {
        const res = await adminFetch(`/admin/stories/${id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
        return (await json<Envelope<AdminStory>>(res)).data;
    },
    async remove(id: string): Promise<void> {
        await json(await adminFetch(`/admin/stories/${id}`, { method: "DELETE" }));
    },
};

// ── Uploads ─────────────────────────────────────────────────────────────
export const uploads = {
    async image(file: File): Promise<{ url: string; width: number; height: number; publicId: string }> {
        const form = new FormData();
        form.append("image", file);
        const res = await adminFetch("/admin/uploads/image", {
            method: "POST",
            body: form,
            raw: true,
        });
        return (await json<Envelope<{ url: string; width: number; height: number; publicId: string }>>(res)).data;
    },
};

// ── Link preview ────────────────────────────────────────────────────────
export interface LinkPreview {
    title?: string;
    description?: string;
    imageUrl?: string;
    siteName?: string;
}

export const linkPreview = {
    async fetch(url: string): Promise<LinkPreview> {
        const res = await adminFetch("/admin/link-preview", {
            method: "POST",
            body: JSON.stringify({ url }),
        });
        return (await json<Envelope<LinkPreview>>(res)).data;
    },
};

// ── Categories ──────────────────────────────────────────────────────────
export const categories = {
    async list(): Promise<AdminCategory[]> {
        return (await json<Envelope<AdminCategory[]>>(await adminFetch("/admin/categories"))).data;
    },
    async create(data: { name: string; slug: string; description?: string; order?: number }) {
        return (await json<Envelope<AdminCategory>>(await adminFetch("/admin/categories", {
            method: "POST", body: JSON.stringify(data),
        }))).data;
    },
    async update(id: string, data: Partial<{ name: string; slug: string; description: string; order: number }>) {
        return (await json<Envelope<AdminCategory>>(await adminFetch(`/admin/categories/${id}`, {
            method: "PATCH", body: JSON.stringify(data),
        }))).data;
    },
    async remove(id: string): Promise<void> {
        await json(await adminFetch(`/admin/categories/${id}`, { method: "DELETE" }));
    },
};

// ── Inbox ───────────────────────────────────────────────────────────────
export const messages = {
    async list(params: { status?: "new" | "read"; page?: number; limit?: number } = {}) {
        const qs = new URLSearchParams();
        if (params.status) qs.set("status", params.status);
        if (params.page) qs.set("page", String(params.page));
        if (params.limit) qs.set("limit", String(params.limit));
        return json<Paginated<AdminMessage>>(await adminFetch(`/admin/messages?${qs}`));
    },
    async markRead(id: string) {
        return (await json<Envelope<AdminMessage>>(await adminFetch(`/admin/messages/${id}`, {
            method: "PATCH", body: JSON.stringify({ status: "read" }),
        }))).data;
    },
};

export const subscribers = {
    async list(params: { status?: "active" | "unsubscribed"; page?: number; limit?: number } = {}) {
        const qs = new URLSearchParams();
        if (params.status) qs.set("status", params.status);
        if (params.page) qs.set("page", String(params.page));
        if (params.limit) qs.set("limit", String(params.limit));
        return json<Paginated<AdminSubscriber>>(await adminFetch(`/admin/subscribers?${qs}`));
    },
    async downloadCsv() {
        const res = await adminFetch("/admin/subscribers?format=csv");
        if (!res.ok) throw new AdminApiError(res.status, "EXPORT_FAILED", "CSV export failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "subscribers.csv";
        a.click();
        URL.revokeObjectURL(url);
    },
};