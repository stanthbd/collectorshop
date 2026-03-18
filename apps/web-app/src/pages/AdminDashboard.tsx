import { useEffect, useState } from 'react';
import { adminApi } from '../lib/api';
import type { Article } from '../lib/types';
import { ArticleCard } from '../components/shared/ArticleCard';
import { AdminModerationModal } from '../components/admin/AdminModerationModal';
import { Loader2, CheckCircle2, Shield } from 'lucide-react';

export function AdminDashboard() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [reasonInput, setReasonInput] = useState<{ [key: string]: string }>({});
    const [modalConfig, setModalConfig] = useState<{ type: 'approve' | 'refuse', articleId: string } | null>(null);
    const [globalError, setGlobalError] = useState<string | null>(null);

    useEffect(() => {
        loadPending();
    }, []);

    async function loadPending() {
        try {
            setLoading(true);
            setGlobalError(null);
            const items = await adminApi.getPendingArticles();
            setArticles(items);
        } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            setGlobalError(`Erreur: ${error}`);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(id: string) {
        // Native window.confirm removed for embedded browser compatibility
        try {
            setActionLoading(id);
            setGlobalError(null);
            await adminApi.approveArticle(id);
            setArticles(prev => prev.filter(a => a.id !== id));
            setModalConfig(null);
        } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            setGlobalError(`Erreur: ${error}`);
        } finally {
            setActionLoading(null);
        }
    }

    async function handleRefuse(id: string) {
        const reason = reasonInput[id]?.trim();
        if (!reason) {
            return;
        }

        try {
            setActionLoading(id);
            setGlobalError(null);
            await adminApi.refuseArticle(id, reason);
            setArticles(prev => prev.filter(a => a.id !== id));
            setModalConfig(null);
            setReasonInput(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
        } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            setGlobalError(`Erreur: ${error}`);
        } finally {
            setActionLoading(null);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                        <Shield className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight">
                            Espace Modération
                        </h1>
                        <p className="text-sm text-slate-400 font-medium mt-1">
                            Validation des pièces de collection soumises
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="bg-amber-500/10 text-amber-400 text-xs py-1.5 px-4 rounded-full font-bold uppercase tracking-wider ring-1 ring-amber-500/20">
                        {articles.length} en attente
                    </span>
                    <button
                        onClick={loadPending}
                        className="text-sm flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold px-4 py-2 hover:bg-indigo-500/10 rounded-lg transition-colors"
                    >
                        Rafraîchir
                    </button>
                </div>
            </div>

            {globalError && (
                <div className="bg-rose-500/10 text-rose-400 text-sm p-4 rounded-xl border border-rose-500/20 font-medium mt-4">
                    {globalError}
                </div>
            )}

            {articles.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl text-center shadow-sm mt-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6 shadow-sm">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-white">Pile de validation vide</h3>
                    <p className="text-slate-400 font-medium">Le catalogue est totalement à jour ! Excellent travail.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {articles.map((article) => (
                        <ArticleCard key={article.id} article={article}>

                            <div className="w-full flex gap-3">
                                <button
                                    onClick={() => setModalConfig({ type: 'refuse', articleId: article.id })}
                                    className="flex-1 bg-slate-950 text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl shadow-sm hover:shadow text-sm font-semibold transition-all duration-200 flex justify-center items-center"
                                >
                                    Refuser
                                </button>
                                <button
                                    onClick={() => setModalConfig({ type: 'approve', articleId: article.id })}
                                    className="flex-[2] bg-emerald-500 text-white hover:bg-emerald-400 px-4 py-2.5 rounded-xl shadow-[0_4px_10px_rgba(16,185,129,0.2)] text-sm font-semibold transition-all duration-200 flex justify-center items-center transform hover:-translate-y-0.5"
                                >
                                    Approuver pour le catalogue
                                </button>
                            </div>
                        </ArticleCard>
                    ))}
                </div>
            )}
            {/* CONFIRMATION MODAL */}
            <AdminModerationModal
                config={modalConfig}
                actionLoading={actionLoading}
                reasonInput={reasonInput}
                onClose={() => setModalConfig(null)}
                onApprove={handleApprove}
                onRefuse={handleRefuse}
                onReasonChange={(id, reason) => setReasonInput((prev) => ({ ...prev, [id]: reason }))}
            />
        </div>
    );
}
