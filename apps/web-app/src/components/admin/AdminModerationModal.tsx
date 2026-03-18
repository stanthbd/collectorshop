import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface AdminModerationModalProps {
    config: { type: 'approve' | 'refuse'; articleId: string } | null;
    actionLoading: string | null;
    reasonInput: { [key: string]: string };
    onClose: () => void;
    onApprove: (id: string) => void;
    onRefuse: (id: string) => void;
    onReasonChange: (id: string, reason: string) => void;
}

export function AdminModerationModal({
    config,
    actionLoading,
    reasonInput,
    onClose,
    onApprove,
    onRefuse,
    onReasonChange,
}: AdminModerationModalProps) {
    if (!config) return null;

    const { type, articleId } = config;
    const isLoading = actionLoading === articleId;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 sm:p-8">
                {type === 'approve' ? (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Confirmer l'approbation</h3>
                        </div>
                        <p className="text-slate-400 text-sm mb-6">
                            Êtes-vous sûr de vouloir approuver cette pièce ? Elle sera immédiatement visible par tous les utilisateurs dans le catalogue public.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                            >
                                Annuler
                            </button>
                            <button
                                disabled={isLoading}
                                onClick={() => onApprove(articleId)}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-xl shadow-[0_4px_10px_rgba(16,185,129,0.2)] transition-colors flex justify-center items-center cursor-pointer disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Oui, approuver'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                                <AlertCircle className="w-6 h-6 text-rose-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Refuser cette pièce</h3>
                        </div>
                        <p className="text-slate-400 text-sm mb-4">
                            Veuillez indiquer le motif du refus. Cet article ne sera pas publié dans le catalogue.
                        </p>
                        <textarea
                            className="w-full text-sm font-medium border border-slate-800 focus:border-rose-500 bg-slate-950 text-rose-100 rounded-xl px-4 py-3 placeholder-rose-500/50 focus:ring-4 focus:ring-rose-500/10 focus:outline-none transition-all resize-none mb-6"
                            rows={3}
                            placeholder="Motif détaillé (obligatoire)..."
                            value={reasonInput[articleId] || ''}
                            onChange={(e) => onReasonChange(articleId, e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                            >
                                Annuler
                            </button>
                            <button
                                disabled={isLoading || !reasonInput[articleId]?.trim()}
                                onClick={() => onRefuse(articleId)}
                                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2.5 px-4 rounded-xl shadow-[0_4px_10px_rgba(244,63,94,0.2)] transition-colors flex justify-center items-center cursor-pointer disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmer le refus'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
