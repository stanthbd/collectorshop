import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Catalog } from '../pages/Catalog';
import { SellerDashboard } from '../pages/SellerDashboard';
import { AdminDashboard } from '../pages/AdminDashboard';
import { Login } from '../pages/Login';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../contexts/useAuth';

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role: string }) => {
    const { isAuth, roles } = useAuth();

    if (!isAuth) {
        // If not authenticated, redirect to public catalog
        return <Navigate to="/catalog" replace />;
    }

    if (!roles.includes(role)) {
        return (
            <div className="p-8 text-center text-red-500">
                <h2 className="text-2xl font-bold">Accès Non Autorisé</h2>
                <p>Vous n'avez pas le rôle requis ({role}) pour voir cette page.</p>
            </div>
        );
    }

    return children;
};

export function AppRouter() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<MainLayout />}>
                        <Route index element={<Navigate to="/catalog" replace />} />
                        <Route path="catalog" element={<Catalog />} />
                        <Route path="login" element={<Login />} />

                        <Route
                            path="seller"
                            element={
                                <ProtectedRoute role="seller">
                                    <SellerDashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="admin"
                            element={
                                <ProtectedRoute role="admin">
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route path="*" element={<Navigate to="/catalog" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
