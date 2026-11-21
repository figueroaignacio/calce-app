import { type CustomerSortField, type SortOrder } from '@calce/types';

export interface CustomersQuery {
  page: number;
  pageSize: number;
  search: string;
  sortBy: CustomerSortField;
  sortOrder: SortOrder;
  isActive?: boolean;
}

export const DEFAULT_CUSTOMERS_QUERY: CustomersQuery = {
  page: 1,
  pageSize: 10,
  search: '',
  sortBy: 'businessName',
  sortOrder: 'asc',
};
