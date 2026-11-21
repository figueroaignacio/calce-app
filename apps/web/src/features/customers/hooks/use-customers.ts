import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customersService } from '@/features/customers/services/customers.service';
import { type CustomersQuery } from '@/features/customers/types';
import { type CreateCustomerInput, type UpdateCustomerInput } from '@calce/types';

export const customersKeys = {
  all: ['customers'] as const,
  list: (query: CustomersQuery) => [...customersKeys.all, 'list', query] as const,
  detail: (id: string) => [...customersKeys.all, 'detail', id] as const,
};

export function useCustomers(query: CustomersQuery) {
  return useQuery({
    queryKey: customersKeys.list(query),
    queryFn: () => customersService.list(query),
    placeholderData: (previous) => previous,
  });
}

export function useCustomerMutations() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: customersKeys.all });

  const create = useMutation({
    mutationFn: (input: CreateCustomerInput) => customersService.create(input),
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: UpdateCustomerInput }) =>
      customersService.update(id, changes),
    onSuccess: refresh,
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => customersService.deactivate(id),
    onSuccess: refresh,
  });

  return { create, update, deactivate };
}
