import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { grievanceApi } from '@/services/api/grievance';

export const useGrievances = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['grievances', page, limit],
    queryFn: () => grievanceApi.getGrievances(page, limit),
  });
};

export const useGrievance = (id: string) => {
  return useQuery({
    queryKey: ['grievance', id],
    queryFn: () => grievanceApi.getGrievanceById(id),
    enabled: !!id,
  });
};

export const useSearchGrievances = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      type: 'grievance_id' | 'phone_number';
      value: string;
      page?: number;
      limit?: number;
    }) => grievanceApi.searchGrievances(params),
    onSuccess: () => {
      // Invalidate and refetch grievances
      queryClient.invalidateQueries({ queryKey: ['grievances'] });
    },
  });
};

export const useUpdateGrievanceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, comment }: { id: string; status: string; comment?: string }) =>
      grievanceApi.updateGrievanceStatus(id, status, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grievances'] });
      queryClient.invalidateQueries({ queryKey: ['grievance'] });
    },
  });
};

export const useDeleteGrievance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => grievanceApi.deleteGrievance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grievances'] });
    },
  });
};

export const useDownloadMedia = () => {
  return useMutation({
    mutationFn: (mediaId: string) => grievanceApi.downloadMedia(mediaId),
  });
};

export const useGrievanceByReportId = (reportId: string) => {
  return useQuery({
    queryKey: ['grievance', 'report', reportId],
    queryFn: () => grievanceApi.getGrievanceByReportId(reportId),
    enabled: !!reportId,
  });
};

