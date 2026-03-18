import { useEffect, useState } from 'react';
import { catalogApi } from '../lib/api';
import type { Article } from '../lib/types';
import { ArticleCard } from '../components/shared/ArticleCard';
import { Loader2, AlertCircle } from 'lucide-react';

export function Catalog() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadCatalog() {
            try {
                setLoading(true);
                // Using simple pagination parameters for POC
                const data = await catalogApi.getCatalog(1, 100);
                setArticles(data.items);
            } catch (err) {
                const error = err instanceof Error ? err.message : String(err);
                setError(error || 'Erreur lors du chargement du catalogue');
            } finally {
                setLoading(false);
            }
        }
        loadCatalog();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="font-medium tracking-wide">Chargement du catalogue prestigieux...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto mt-10 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl flex items-start space-x-4 shadow-sm">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5 text-rose-500" />
                <div>
                    <h3 className="font-bold text-lg mb-1">Impossible d'accéder à la collection</h3>
                    <p className="text-sm opacity-90 leading-relaxed">{error}</p>
                </div>
            </div>
        );
    }

    if (articles.length === 0) {
        return (
            <div className="text-center py-32 bg-slate-900 rounded-3xl shadow-sm border border-slate-800 mt-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-800/50 border border-slate-700 mb-6 shadow-inner">
                    <AlertCircle className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-3 tracking-tight">Le catalogue est en préparation</h3>
                <p className="text-slate-400 max-w-md mx-auto text-base leading-relaxed">
                    Notre sélection d'objets de collection exclusifs est actuellement vide. Revenez très bientôt pour découvrir nos nouveautés.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="text-center pt-8 pb-4 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 rounded-full" />
                <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl lg:text-6xl mb-6">
                    L'<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">Exclusivité</span> à Portée de Main
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Découvrez des pièces rares et authentifiées, mises en vente par des collectionneurs passionnés et validées par nos experts.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                ))}
            </div>
        </div>
    );
}
