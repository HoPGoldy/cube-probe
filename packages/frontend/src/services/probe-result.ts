import { CommonListQueryDto } from "@/types/global";
import { queryClient, requestPost } from "./base";
import { useMutation, useQuery } from "@tanstack/react-query";

export interface ProbeResultListQueryDto extends CommonListQueryDto {
  endPointId?: string;
  serviceId?: string;
  limit?: number;
}

export const useGetProbeResultList = (query?: ProbeResultListQueryDto) => {
  return useQuery({
    queryKey: ["probe-result/list", query],
    queryFn: () => requestPost("probe-result/list", query || {}),
  });
};

export const useGetProbeResultListByEndpoint = (
  endPointId: string,
  limit?: number,
  refetchInterval = 30 * 1000,
) => {
  return useQuery({
    queryKey: ["probe-result/list-by-endpoint", endPointId, limit],
    enabled: !!endPointId,
    refetchInterval,
    queryFn: () =>
      requestPost("probe-result/list-by-endpoint", { endPointId, limit }),
  });
};

export const useGetProbeResultListByService = (
  serviceId: string,
  limit?: number,
) => {
  return useQuery({
    queryKey: ["probe-result/list-by-service", serviceId, limit],
    enabled: !!serviceId,
    queryFn: () =>
      requestPost("probe-result/list-by-service", { serviceId, limit }),
  });
};

export const useGetLatestProbeResults = () => {
  return useQuery({
    queryKey: ["probe-result/latest"],
    queryFn: () => requestPost("probe-result/latest", {}),
  });
};

export const useGetProbeResultDetail = (id: string) => {
  return useQuery({
    queryKey: ["probe-result/detail", id],
    enabled: !!id,
    queryFn: () => requestPost("probe-result/get", { id }),
  });
};

export interface ProbeResultCreateDto {
  endPointId: string;
  status?: number;
  responseTime?: number;
  timestamp?: string;
  success: boolean;
  message?: string;
}

export const useCreateProbeResult = () => {
  return useMutation({
    mutationFn: (data: ProbeResultCreateDto) =>
      requestPost("probe-result/create", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["probe-result/list"] });
      queryClient.invalidateQueries({
        queryKey: ["probe-result/list-by-endpoint"],
      });
      queryClient.invalidateQueries({
        queryKey: ["probe-result/list-by-service"],
      });
      queryClient.invalidateQueries({ queryKey: ["probe-result/latest"] });
    },
  });
};

export const useDeleteProbeResult = () => {
  return useMutation({
    mutationFn: (id: string) => requestPost("probe-result/delete", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["probe-result/list"] });
      queryClient.invalidateQueries({
        queryKey: ["probe-result/list-by-endpoint"],
      });
      queryClient.invalidateQueries({
        queryKey: ["probe-result/list-by-service"],
      });
      queryClient.invalidateQueries({ queryKey: ["probe-result/latest"] });
    },
  });
};
