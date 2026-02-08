import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="h-screen flex items-center justify-center">Carregando...</div>;

    if (!user) {
        return <Navigate to="/login" />;
    }

    return children;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={
                        <ProtectedRoute>
                            <MainLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Transactions />} />
                        <Route path="transactions" element={<Transactions />} />
                        <Route path="categories" element={<Categories />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
