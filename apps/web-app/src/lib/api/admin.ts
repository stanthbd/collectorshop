import { apiClient } from '../apiClient';
import type { Article } from '../types';

export const adminApi = {
    getPendingArticles: () => {
        return apiClient<Article[]>('/admin/articles/pending');
    },

    approveArticle: (id: string) => {
        return apiClient<{ message: string }>(`/admin/articles/${id}/approve`, {
            method: 'POST',
        });
    },

    refuseArticle: (id: string, reason: string) => {
        return apiClient<{ message: string }>(`/admin/articles/${id}/refuse`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    },
};
