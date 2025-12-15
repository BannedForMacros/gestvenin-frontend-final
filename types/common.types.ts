export interface MetaPagination {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: MetaPagination;
}