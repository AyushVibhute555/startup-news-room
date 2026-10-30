// src/lib/api.ts
// The single place the app reads data. Every function hits the Express
// backend and normalises its response into the shapes the pages expect.

import { categories as staticCategories } from "@/data/categories";
import type { Category, Paginated, Story } from "@/types/story";

// ── Config ──────────────────────────────────────────────────────────────
const API_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:4000/api/v1";

// ── Error type ──────────────────────────────────────────────────────────
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ── Backend wire shapes (internal, never exported) ──────────────────────
interface BackendEnvelope<T> {
  data: T;
}

interface BackendPaginated<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface BackendError {
  error: { code: string; message: string; details?: unknown };
}

// ── Low-level fetch ─────────────────────────────────────────────────────
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let payload: BackendError | null = null;
    try {
      payload = (await res.json()) as BackendError;
    } catch {
      // non-JSON error body (e.g. a proxy 502 page)
    }
    throw new ApiError(
      res.status,
      payload?.error.code ?? "UNKNOWN_ERROR",
      payload?.error.message ?? `Request failed with ${res.status}`,
      payload?.error.details,
    );
  }

  return (await res.json()) as T;
}

// ── Adapters (backend wire shape → frontend type) ───────────────────────
function adaptPaginated<T>(res: BackendPaginated<T>): Paginated<T> {
  return {
    items: res.data,
    total: res.pagination.total,
    page: res.pagination.page,
    limit: res.pagination.limit,
    hasMore: res.pagination.hasMore,
  };
}

// Backend hard-caps `limit` at 50. Archive/Search pass 100; clamp silently.
function clampLimit(n: number, max = 50): number {
  if (n > max) {
    if (import.meta.env.DEV) {
      console.warn(`[api] requested limit ${n} exceeds backend max ${max}; clamping.`);
    }
    return max;
  }
  return n;
}

// ── Public API — same signatures as the old mock layer ──────────────────

export interface GetStoriesParams {
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export async function getStories({
  category,
  q,
  page = 1,
  limit = 9,
}: GetStoriesParams = {}): Promise<Paginated<Story>> {
  const qs = new URLSearchParams();
  if (category) qs.set("category", category);
  if (q) qs.set("q", q);
  qs.set("page", String(page));
  qs.set("limit", String(clampLimit(limit)));

  const res = await request<BackendPaginated<Story>>(`/stories?${qs.toString()}`);
  return adaptPaginated(res);
}

export async function getFeaturedStory(): Promise<Story | null> {
  const res = await request<BackendEnvelope<Story | null>>("/stories/featured");
  return res.data ?? null;
}

export async function getTopStories(): Promise<Story[]> {
  const res = await request<BackendEnvelope<Story[]>>("/stories/top");
  return res.data;
}

export async function getBreakingStories(): Promise<Story[]> {
  const res = await request<BackendEnvelope<Story[]>>("/stories/breaking");
  return res.data;
}

export async function getStoryBySlug(slug: string): Promise<Story | null> {
  try {
    const res = await request<BackendEnvelope<Story>>(
      `/stories/${encodeURIComponent(slug)}`,
    );
    return res.data;
  } catch (err) {
    // Backend returns 404 for unknown / unpublished stories.
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function getRelatedStories(slug: string): Promise<Story[]> {
  const res = await request<BackendEnvelope<Story[]>>(
    `/stories/${encodeURIComponent(slug)}/related`,
  );
  return res.data;
}

export async function getCategories(): Promise<Category[]> {
  // Intentionally still static. The mock categories match the backend seed
  // slugs exactly, and no consumer uses `storyCount`. Swap this body to
  // `request<BackendEnvelope<Category[]>>("/categories")` later if you want
  // live counts in the header.
  return staticCategories;
}

// ── Forms ───────────────────────────────────────────────────────────────

export async function subscribeNewsletter(email: string): Promise<void> {
  await request<BackendEnvelope<{ subscribed: true }>>("/newsletter/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export interface ContactPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
  type?: "contact" | "tip";
}

export async function sendContactMessage(payload: ContactPayload): Promise<void> {
  await request<BackendEnvelope<{ received: true }>>("/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "contact",
      website: "", // honeypot — always empty for real users
      ...payload,
    }),
  });
}