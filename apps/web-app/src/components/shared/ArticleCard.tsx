import type { Article } from '../../lib/types';
import { StatusBadge } from './StatusBadge';

export function ArticleCard({ article, children }: { article: Article, children?: React.ReactNode }) {
    const formattedPrice = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(article.price);

    const formattedDate = new Date(article.publishedAt || article.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    return (
        <div className="group bg-slate-900 rounded-2xl shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-300 border border-slate-800 overflow-hidden flex flex-col h-full transform hover:-translate-y-1 hover:border-indigo-500/30">
            {/* Visual Image Placeholder / Graphic area (for a premium feel, even without images yet) */}
            <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden flex items-center justify-center border-b border-slate-800">
                <div className="absolute inset-0 bg-grid-slate-700/[0.04] bg-[length:16px_16px]" />
                <span className="text-slate-600 font-medium tracking-widest uppercase text-xs">Aperçu indisponible</span>
                <div className="absolute top-3 left-3">
                    <StatusBadge status={article.status} />
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-100 line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors" title={article.title}>
                        {article.title}
                    </h3>
                </div>

                <div className="mb-4">
                    <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">{formattedPrice}</span>
                </div>

                <p className="text-slate-400 text-sm flex-1 line-clamp-3 mb-5 leading-relaxed">
                    {article.description}
                </p>

                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-auto pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span>{formattedDate}</span>
                    </div>
                    <span className="bg-slate-800/50 px-2 py-1 rounded text-slate-400 border border-slate-700/50" title={`ID: ${article.id}`}>#{article.id.split('-')[0]}</span>
                </div>
            </div>

            {/* Optional action slot (for admin/seller controls) */}
            {children && (
                <div className="bg-slate-900/50 px-5 py-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                    {children}
                </div>
            )}
        </div>
    );
}
