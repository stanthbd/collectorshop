import { useState } from 'react';
import { Plus, AlertCircle, X, Loader2 } from 'lucide-react';
import { sellerApi } from '../../lib/api';
import type { Article } from '../../lib/types';

interface CreateArticleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (article: Article) => void;
}

export function CreateArticleModal({ isOpen, onClose, onSuccess }: CreateArticleModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError('');

        if (!title || !description || !price) {
            setFormError('Tous les champs sont requis.');
            return;
        }

        try {
            setSubmitting(true);
            const newArticle = await sellerApi.createArticle({
                title,
                description,
                price: Number(price),
            });
            // Reset form
            setTitle('');
            setDescription('');
            setPrice('');
            onSuccess(newArticle);
            onClose();
        } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            setFormError(error || "Erreur lors de la création de l'article");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                            <Plus className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Nouvelle Pièce</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-300 hover:bg-slate-800 p-2 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body (Form) */}
                <div className="p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {formError && (
                            <div className="bg-rose-500/10 text-rose-400 text-sm p-4 rounded-xl border border-rose-500/20 font-medium flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {formError}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-300">Titre de l'objet</label>
                            <input
                                type="text"
                                className="w-full border-slate-800 bg-slate-950 border rounded-xl shadow-sm px-4 py-3 text-sm text-white focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                                placeholder="Appareil photo Leica M3..."
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-300">Prix estimé (€)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="text-slate-500 font-medium">€</span>
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    className="w-full pl-9 border-slate-800 bg-slate-950 border rounded-xl shadow-sm px-4 py-3 text-sm text-white focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                                    placeholder="2500.00"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-300">Description détaillée</label>
                            <textarea
                                rows={4}
                                className="w-full border-slate-800 bg-slate-950 border rounded-xl shadow-sm px-4 py-3 text-sm text-white focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
                                placeholder="Numéro de série, état de conservation, historique, certificats..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                            <p className="text-[11px] font-medium text-slate-500 mt-2 leading-relaxed">
                                Analyse automatique par notre IA. L'inclusion de coordonnées de contact ou de plus de 2 liens entraînera un refus immédiat.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-[0_4px_10px_rgba(79,70,229,0.2)] text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 disabled:opacity-50 transform hover:-translate-y-0.5 transition-all duration-200 mt-6"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Soumettre à modération'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
