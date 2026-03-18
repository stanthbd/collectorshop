import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageSearch, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

export function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!username || !password) {
            setError('Veuillez remplir tous les champs.');
            return;
        }

        try {
            setLoading(true);
            await login(username, password);
            navigate('/catalog'); // Default redirect after login
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message || 'Erreur lors de la connexion.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex w-full h-full items-center justify-center py-10">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-slate-800 overflow-hidden relative">
                {/* Visual Header Graphic */}
                <div className="h-24 sm:h-32 bg-gradient-to-br from-indigo-500/20 to-violet-600/10 relative overflow-hidden flex items-center justify-center border-b border-slate-800">
                    <div className="absolute inset-0 bg-grid-slate-700/[0.04] bg-[length:16px_16px]" />
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white p-3 sm:p-4 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.4)] relative z-10">
                        <PackageSearch className="h-6 w-6 sm:h-8 sm:w-8" />
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
                            Connexion
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">
                            Accédez à votre espace Collector.shop
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-rose-500/10 text-rose-400 text-sm p-4 rounded-xl border border-rose-500/20 font-medium flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-300">
                                Identifiant
                            </label>
                            <input
                                type="text"
                                className="w-full border-slate-800 bg-slate-950 border rounded-xl shadow-sm px-4 py-3 text-sm text-white focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder-slate-600"
                                placeholder="ex: seller1"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-300">
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                className="w-full border-slate-800 bg-slate-950 border rounded-xl shadow-sm px-4 py-3 text-sm text-white focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder-slate-600"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-8 flex justify-center items-center py-3.5 px-4 rounded-xl shadow-[0_4px_10px_rgba(79,70,229,0.2)] text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 disabled:opacity-50 transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4 mr-2" />
                                    Se connecter
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
