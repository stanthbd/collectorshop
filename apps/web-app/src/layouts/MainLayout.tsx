import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { LogIn, LogOut, PackageSearch, Store, Shield, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

export function MainLayout() {
    const { isAuth, roles, logout } = useAuth();
    const isSeller = roles.includes('seller');
    const isAdmin = roles.includes('admin');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-300 selection:bg-indigo-500 selection:text-white relative">
            {/* HEADER - Premium Dark Glassmorphism */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">

                        {/* Logo area */}
                        <div className="flex items-center space-x-3 group cursor-pointer" onClick={closeMobileMenu}>
                            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white p-2.5 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all duration-300 group-hover:scale-105">
                                <PackageSearch className="h-6 w-6" />
                            </div>
                            <span className="font-extrabold text-2xl tracking-tight text-white">
                                Collector<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">.shop</span>
                            </span>
                        </div>

                        {/* Navigation (Desktop) */}
                        <nav className="hidden md:flex items-center space-x-2">
                            <NavLink
                                to="/catalog"
                                className={({ isActive }) => `flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-indigo-500/10 text-indigo-400 shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            >
                                <span>Catalogue</span>
                            </NavLink>

                            {isSeller && (
                                <NavLink
                                    to="/seller"
                                    className={({ isActive }) => `flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-indigo-500/10 text-indigo-400 shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                                >
                                    <Store className="w-4.5 h-4.5" />
                                    <span>Espace Vendeur</span>
                                </NavLink>
                            )}

                            {isAdmin && (
                                <NavLink
                                    to="/admin"
                                    className={({ isActive }) => `flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-rose-500/10 text-rose-400 shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                                >
                                    <Shield className="w-4.5 h-4.5" />
                                    <span>Modération</span>
                                </NavLink>
                            )}
                        </nav>

                        {/* Auth section & Mobile Toggle */}
                        <div className="flex items-center space-x-4">
                            {/* Desktop Auth */}
                            <div className="hidden sm:flex items-center space-x-4">
                                {isAuth ? (
                                    <>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Rôles</span>
                                            <div className="flex flex-wrap justify-end gap-1 mt-0.5">
                                                {roles.map(role => (
                                                    <span key={role} className={`text-xs font-semibold px-2 py-0.5 rounded-md ${role === 'admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                                                        {role}
                                                    </span>
                                                ))}
                                                {roles.length === 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">user</span>}
                                            </div>
                                        </div>
                                        <button
                                            onClick={logout}
                                            className="inline-flex items-center justify-center px-4 py-2.5 border border-slate-700/80 rounded-xl shadow-sm text-sm font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 hover:border-slate-600 hover:text-white transition-all duration-200"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Déconnexion
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent rounded-xl shadow-[0_4px_10px_rgba(79,70,229,0.2)] text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-950 transform hover:-translate-y-0.5 transition-all duration-200"
                                    >
                                        <LogIn className="w-4 h-4 mr-2" />
                                        Se connecter
                                    </Link>
                                )}
                            </div>

                            {/* Mobile menu toggle button */}
                            <button
                                className="md:hidden p-2 text-slate-400 hover:text-white focus:outline-none"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-20 left-0 w-full bg-slate-950 border-b border-slate-800/80 shadow-2xl py-4 flex flex-col px-4 z-40 animate-in slide-in-from-top-2 duration-200">
                        <NavLink
                            to="/catalog"
                            onClick={closeMobileMenu}
                            className={({ isActive }) => `flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 mb-2 ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400'}`}
                        >
                            <span>Catalogue</span>
                        </NavLink>

                        {isSeller && (
                            <NavLink
                                to="/seller"
                                onClick={closeMobileMenu}
                                className={({ isActive }) => `flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 mb-2 ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400'}`}
                            >
                                <Store className="w-5 h-5" />
                                <span>Espace Vendeur</span>
                            </NavLink>
                        )}

                        {isAdmin && (
                            <NavLink
                                to="/admin"
                                onClick={closeMobileMenu}
                                className={({ isActive }) => `flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 mb-2 ${isActive ? 'bg-rose-500/10 text-rose-400' : 'text-slate-400'}`}
                            >
                                <Shield className="w-5 h-5" />
                                <span>Modération</span>
                            </NavLink>
                        )}

                        <div className="h-px w-full bg-slate-800/50 my-4"></div>

                        {/* Mobile Auth Actions */}
                        <div className="px-4">
                            {isAuth ? (
                                <button
                                    onClick={() => {
                                        logout();
                                        closeMobileMenu();
                                    }}
                                    className="w-full flex items-center justify-center px-4 py-3 border border-slate-700/80 rounded-xl text-sm font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800"
                                >
                                    <LogOut className="w-5 h-5 mr-3" />
                                    Déconnexion
                                </button>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={closeMobileMenu}
                                    className="w-full flex items-center justify-center px-5 py-3 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600"
                                >
                                    <LogIn className="w-5 h-5 mr-3" />
                                    Se connecter
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* MAIN CONTENT DIV */}
            <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in">
                <Outlet />
            </main>

            {/* FOOTER */}
            <footer className="bg-slate-950 border-t border-slate-800/80 mt-auto">
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-2 text-slate-500 mb-4 md:mb-0">
                        <PackageSearch className="h-5 w-5 opacity-70" />
                        <span className="font-semibold text-sm tracking-wide">Collector.shop</span>
                    </div>
                    <p className="text-center text-sm text-slate-500 hover:text-slate-300 transition-colors">
                        © {new Date().getFullYear()} Démonstration Interne. Tous droits réservés.
                    </p>
                </div>
            </footer>
        </div>
    );
}
