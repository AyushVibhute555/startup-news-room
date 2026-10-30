// src/admin/components/AdminLayout.tsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

const links = [
    { to: "/admin/stories", label: "Stories" },
    { to: "/admin/categories", label: "Categories" },
    { to: "/admin/messages", label: "Messages" },
    { to: "/admin/subscribers", label: "Subscribers" },
];

export function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    async function onLogout() {
        await logout();
        navigate("/admin/login", { replace: true });
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-6">
                        <span className="font-label font-semibold">SNR Admin</span>
                        <nav className="flex gap-1">
                            {links.map((l) => (
                                <NavLink
                                    key={l.to}
                                    to={l.to}
                                    className={({ isActive }) =>
                                        `rounded px-3 py-1.5 text-sm transition-colors ${isActive
                                            ? "bg-foreground text-background"
                                            : "text-muted-foreground hover:text-foreground"
                                        }`
                                    }
                                >
                                    {l.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{user?.email}</span>
                        <span className="rounded bg-muted px-2 py-0.5 text-xs uppercase">{user?.role}</span>
                        <button onClick={onLogout} className="text-muted-foreground hover:text-signal">
                            Log out
                        </button>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-7xl px-4 py-8">
                <Outlet />
            </main>
        </div>
    );
}