import {
  type CreateCustomerInput,
  type Customer,
  type PaginatedResponse,
  type UpdateCustomerInput,
} from '@calce/types';
import { type CustomersQuery } from '@/features/customers/types';
import { apiClient } from '@/shared/lib/api-client';

export const customersService = {
  list: (query: CustomersQuery): Promise<PaginatedResponse<Customer>> =>
    apiClient.get<PaginatedResponse<Customer>>('/customers', {
      page: query.page,
      pageSize: query.pageSize,
      search: query.search.trim() || undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      isActive: query.isActive,
    }),
  detail: (id: string): Promise<Customer> => apiClient.get<Customer>(`/customers/${id}`),
  create: (input: CreateCustomerInput): Promise<Customer> =>
    apiClient.post<Customer>('/customers', input),
  update: (id: string, input: UpdateCustomerInput): Promise<Customer> =>
    apiClient.patch<Customer>(`/customers/${id}`, input),
  deactivate: (id: string): Promise<void> => apiClient.delete(`/customers/${id}`),
};
