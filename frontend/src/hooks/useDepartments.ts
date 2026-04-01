import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentApi } from '@/services/api/admin';
import type { CreateDepartmentRequest } from '@/types';

export const useDepartments = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['departments', page, limit],
    queryFn: () => departmentApi.getDepartments(page, limit),
  });
};

export const useDepartment = (id: string) => {
  return useQuery({
    queryKey: ['department', id],
    queryFn: () => departmentApi.getDepartmentById(id),
    enabled: !!id,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (departmentData: CreateDepartmentRequest) =>
      departmentApi.createDepartment(departmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, departmentData }: { id: string; departmentData: Partial<CreateDepartmentRequest> }) =>
      departmentApi.updateDepartment(id, departmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['department'] });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => departmentApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

