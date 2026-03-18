import { apiClient } from '../apiClient';
import type { Article, PaginatedResult } from '../types';

export const catalogApi = {
    getCatalog: (page: number = 1, limit: number = 10) => {
        return apiClient<PaginatedResult<Article>>('/catalog', {
            params: { page, limit },
        });
    },
};
