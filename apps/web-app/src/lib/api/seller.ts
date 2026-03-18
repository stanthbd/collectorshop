import { apiClient } from '../apiClient';
import type { Article, CreateArticleDto } from '../types';

export const sellerApi = {
    createArticle: (data: CreateArticleDto) => {
        return apiClient<Article>('/articles', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getMyArticles: () => {
        return apiClient<Article[]>('/me/articles');
    },
};
