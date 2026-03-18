export type ArticleStatus =
    | 'EN_ATTENTE_MODERATION'
    | 'REJETE_AUTO'
    | 'EN_ATTENTE_ADMIN'
    | 'REFUSE'
    | 'PUBLIE';

export interface Article {
    id: string;
    sellerId: string;
    title: string;
    description: string;
    price: number;
    status: ArticleStatus;
    createdAt: string;
    publishedAt?: string;
    contentCheckReasons?: string[] | string | null;
}

export interface PaginatedResult<T> {
    items: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface CreateArticleDto {
    title: string;
    description: string;
    price: number;
}
