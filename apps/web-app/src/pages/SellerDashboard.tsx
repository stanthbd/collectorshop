import { useEffect, useState } from 'react';
import { sellerApi } from '../lib/api';
import type { Article } from '../lib/types';
import { ArticleCard } from '../components/shared/ArticleCard';
import { CreateArticleModal } from '../components/seller/CreateArticleModal';
import { Loader2, Plus, Store, AlertCircle } from 'lucide-react';

export function SellerDashboard() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadMyArticles();
    }, []);

    async function loadMyArticles() {
        try {
            setLoading(true);
            const items = await sellerApi.getMyArticles();
            setArticles(items);
        } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            alert(`Erreur: ${error}`);
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="max-w-6xl mx-auto space-y-8 relative">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                        <Store className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight">Ma Collection Privée</h1>
                        <p className="text-sm text-slate-400 font-medium mt-1">Gérez votre inventaire et vos soumissions</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-[0_4px_10px_rgba(79,70,229,0.2)] transition-all transform hover:-translate-y-0.5"
                >
                    <Plus className="w-5 h-5" />
                    Nouvelle Pièce
                </button>
            </div>

            {/* LIST */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                </div>
            ) : articles.length === 0 ? (
                <div className="text-center py-24 bg-slate-900 rounded-3xl border border-slate-800 shadow-sm mt-4">
                    <p className="text-slate-400 font-medium text-lg">Votre inventaire est vide.</p>
                    <p className="text-slate-500 text-sm mt-2">Commencez par ajouter votre première pièce de collection.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map((article) => (
                        <ArticleCard key={article.id} article={article}>
                            {/* Specific overlay info for seller if rejected */}
                            {article.contentCheckReasons && article.status.includes('REJET') && (
                                <div className="w-full flex items-start gap-2 text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs font-semibold leading-relaxed">
                                        Modération Bot : {Array.isArray(article.contentCheckReasons) ? article.contentCheckReasons.join(', ') : article.contentCheckReasons}
                                    </p>
                                </div>
                            )}
                            {/* Manual admin refuse reasons */}
                            {article.status === 'REFUSE' && !article.contentCheckReasons && (
                                <div className="w-full flex items-start gap-2 text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs font-semibold leading-relaxed">
                                        Refus Administratif.
                                    </p>
                                </div>
                            )}
                        </ArticleCard>
                    ))}
                </div>
            )}

            {/* MODAL OVERLAY */}
            <CreateArticleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={(newArticle) => {
                    setArticles(prev => [newArticle, ...prev]);
                }}
            />
        </div>
    );
}
