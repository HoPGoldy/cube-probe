import { CommonListQueryDto } from "@/types/global";
import { queryClient, requestPost } from "./base";
import { useMutation, useQuery } from "@tanstack/react-query";

export interface EndpointListQueryDto extends CommonListQueryDto {
  serviceId?: string;
}

export const useGetEndpointList = (query?: EndpointListQueryDto) => {
  return useQuery({
    queryKey: ["endpoint/list", query],
    queryFn: () => requestPost("endpoint/list", query || {}),
  });
};

export const useGetEndpointListByService = (serviceId: string) => {
  return useQuery({
    queryKey: ["endpoint/list-by-service", serviceId],
    enabled: !!serviceId,
    queryFn: () => requestPost("endpoint/list-by-service", { serviceId }),
  });
};

export const useGetEndpointDetail = (id: string) => {
  return useQuery({
    queryKey: ["endpoint/detail", id],
    enabled: !!id,
    queryFn: () => requestPost("endpoint/get", { id }),
  });
};

export interface EndpointCreateDto {
  serviceId: string;
  name: string;
  url?: string;
  headers?: any;
  cronExpression?: string;
  enabled?: boolean;
  timeout?: number;
}

export const useCreateEndpoint = () => {
  return useMutation({
    mutationFn: (data: EndpointCreateDto) =>
      requestPost("endpoint/create", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["endpoint/list"] });
      queryClient.invalidateQueries({
        queryKey: ["endpoint/list-by-service"],
      });
    },
  });
};

export interface EndpointUpdateDto extends Partial<EndpointCreateDto> {
  id: string;
}

export const useUpdateEndpoint = () => {
  return useMutation({
    mutationFn: (data: EndpointUpdateDto) =>
      requestPost("endpoint/update", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["endpoint/list"] });
      queryClient.invalidateQueries({
        queryKey: ["endpoint/list-by-service"],
      });
      queryClient.invalidateQueries({ queryKey: ["endpoint/detail"] });
    },
  });
};

export const useDeleteEndpoint = () => {
  return useMutation({
    mutationFn: (id: string) => requestPost("endpoint/delete", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["endpoint/list"] });
      queryClient.invalidateQueries({
        queryKey: ["endpoint/list-by-service"],
      });
    },
  });
};
