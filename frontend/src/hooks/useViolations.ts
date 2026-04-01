import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { violationApi } from '@/services/api/admin';
import type { CreateViolationRequest, UpdateViolationRequest } from '@/types';

export const useViolations = (
  page: number = 1,
  limit: number = 10,
  filters?: {
    status?: string;
    priority?: string;
    departmentId?: string;
    assignee?: string;
    isOverdue?: boolean;
  }
) => {
  return useQuery({
    queryKey: ['violations', page, limit, filters],
    queryFn: () => violationApi.getViolations(page, limit, filters),
  });
};

export const useMyViolations = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['violations', 'my', page, limit],
    queryFn: () => violationApi.getMyViolations(page, limit),
  });
};

export const useTeamViolations = (page: number = 1, limit: number = 10, departmentId?: string) => {
  return useQuery({
    queryKey: ['violations', 'team', page, limit, departmentId],
    queryFn: () => violationApi.getTeamViolations(page, limit, departmentId),
  });
};

export const useViolation = (id: string) => {
  return useQuery({
    queryKey: ['violation', id],
    queryFn: () => violationApi.getViolationById(id),
    enabled: !!id,
  });
};

export const useCreateViolation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (violationData: CreateViolationRequest) => violationApi.createViolation(violationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
    },
  });
};

export const useUpdateViolation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, violationData }: { id: string; violationData: UpdateViolationRequest }) =>
      violationApi.updateViolation(id, violationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      queryClient.invalidateQueries({ queryKey: ['violation'] });
    },
  });
};

export const useDeleteViolation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => violationApi.deleteViolation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
    },
  });
};

export const useUpdateViolationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      violationApi.updateViolationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      queryClient.invalidateQueries({ queryKey: ['violation'] });
    },
  });
};

export const useAssignViolation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assignee }: { id: string; assignee: string }) =>
      violationApi.assignViolation(id, assignee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      queryClient.invalidateQueries({ queryKey: ['violation'] });
    },
  });
};

