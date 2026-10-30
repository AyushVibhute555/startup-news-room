// src/admin/AdminRoot.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { AdminGuard } from "./components/AdminGuard";
import { AdminLayout } from "./components/AdminLayout";
import { LoginPage } from "./pages/LoginPage";
import { StoriesListPage } from "./pages/StoriesListPage";
import { StoryEditorPage } from "./pages/StoryEditorPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { MessagesPage } from "./pages/MessagesPage";
import { SubscribersPage } from "./pages/SubscribersPage";

export function AdminRoot() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/admin/login" element={<LoginPage />} />
                <Route
                    path="/admin"
                    element={
                        <AdminGuard>
                            <AdminLayout />
                        </AdminGuard>
                    }
                >
                    <Route index element={<Navigate to="/admin/stories" replace />} />
                    <Route path="stories" element={<StoriesListPage />} />
                    <Route path="stories/new" element={<StoryEditorPage />} />
                    <Route path="stories/:id/edit" element={<StoryEditorPage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="messages" element={<MessagesPage />} />
                    <Route path="subscribers" element={<SubscribersPage />} />
                </Route>
            </Routes>
        </AuthProvider>
    );
}