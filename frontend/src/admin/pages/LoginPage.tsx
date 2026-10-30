// src/admin/pages/LoginPage.tsx
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { AdminApiError } from "../lib/api";

export function LoginPage() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from ?? "/admin/stories";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    if (user) return <Navigate to={from} replace />;

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            await login(email.trim().toLowerCase(), password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(
                err instanceof AdminApiError ? err.message : "Invalid email or password",
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <form
                onSubmit={onSubmit}
                className="w-full max-w-sm space-y-4 rounded-lg border border-border p-6"
            >
                <div>
                    <h1 className="font-label text-2xl">Admin sign in</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Use the credentials from your backend .env file.
                    </p>
                </div>
                <label className="block">
                    <span className="text-sm font-medium">Email</span>
                    <input
                        type="email"
                        required
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 w-full rounded border border-border bg-background px-3 py-2 outline-none focus-visible:border-foreground"
                    />
                </label>
                <label className="block">
                    <span className="text-sm font-medium">Password</span>
                    <input
                        type="password"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 w-full rounded border border-border bg-background px-3 py-2 outline-none focus-visible:border-foreground"
                    />
                </label>
                {error && <p className="text-sm text-signal">{error}</p>}
                <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60"
                >
                    {busy ? "Signing in…" : "Sign in"}
                </button>
            </form>
        </div>
    );
}