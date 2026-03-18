import type { ArticleStatus } from '../../lib/types';

export function StatusBadge({ status }: { status: ArticleStatus | string }) {
    let color = 'bg-slate-500/10 text-slate-400 ring-slate-500/20';
    let label = status;

    switch (status) {
        case 'EN_ATTENTE_MODERATION':
            color = 'bg-amber-500/10 text-amber-400 ring-amber-500/20';
            label = 'En Attente (Bot)';
            break;
        case 'EN_ATTENTE_ADMIN':
            color = 'bg-sky-500/10 text-sky-400 ring-sky-500/20';
            label = 'En Attente (Admin)';
            break;
        case 'REJETE_AUTO':
        case 'REFUSE':
            color = 'bg-rose-500/10 text-rose-400 ring-rose-500/20';
            label = status === 'REJETE_AUTO' ? 'Rejeté (Bot)' : 'Refusé';
            break;
        case 'PUBLIE':
            color = 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20';
            label = 'Publié';
            break;
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${color}`}>
            {label}
        </span>
    );
}
