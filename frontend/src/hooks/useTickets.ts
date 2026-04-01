import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '@/services/api/admin';
import type { CreateTicketRequest, UpdateTicketRequest } from '@/types';

export const useTickets = (
  page: number = 1,
  limit: number = 10,
  filters?: {
    status?: string;
    priority?: string;
    type?: string;
    assignedTo?: string;
    departmentId?: string;
  }
) => {
  return useQuery({
    queryKey: ['tickets', page, limit, filters],
    queryFn: () => ticketApi.getTickets(page, limit, filters),
  });
};

export const useMyTickets = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['tickets', 'my', page, limit],
    queryFn: () => ticketApi.getMyTickets(page, limit),
  });
};

export const useTicket = (id: string) => {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketApi.getTicketById(id),
    enabled: !!id,
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketData: CreateTicketRequest) => ticketApi.createTicket(ticketData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ticketData }: { id: string; ticketData: UpdateTicketRequest }) =>
      ticketApi.updateTicket(id, ticketData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket'] });
    },
  });
};

export const useDeleteTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ticketApi.deleteTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, comment }: { id: string; status: string; comment?: string }) =>
      ticketApi.updateTicketStatus(id, status, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket'] });
    },
  });
};

