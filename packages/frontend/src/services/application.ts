import { CommonListQueryDto } from "@/types/global";
import { queryClient, requestPost } from "./base";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DEFAULT_TOKEN_KEY, SELF_APP_ID } from "@/config";

export interface Application {
  id: string;
  name: string;
  subTitle?: string;
  tokenKey: string;
  createdAt: string;
  updatedAt: string;
  registrationMode?: boolean;
}

export interface ApplicationListQueryDto extends CommonListQueryDto {}

export const useGetApplicationList = (query: ApplicationListQueryDto) => {
  return useQuery({
    queryKey: ["application/list", query],
    queryFn: () => requestPost("application/list", query),
  });
};

const DEFAULT_APP_DETAIL: Application = {
  id: SELF_APP_ID,
  name: "Cube Auth",
  subTitle: "统一登录平台",
  tokenKey: DEFAULT_TOKEN_KEY,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const useGetApplicationDetail = (id: string) => {
  const result = useQuery({
    queryKey: ["application/detail", id],
    enabled: !!id && id !== SELF_APP_ID,
    queryFn: () => {
      return requestPost<Application>("application/detail", { id });
    },
  });

  let appDetail = result.data?.data;
  if (id === SELF_APP_ID) {
    appDetail = JSON.parse(JSON.stringify(DEFAULT_APP_DETAIL));
  } else if (appDetail?.registrationMode === false) {
    appDetail = {
      ...JSON.parse(JSON.stringify(DEFAULT_APP_DETAIL)),
      registrationMode: false,
    };
  }

  return { ...result, appDetail };
};

export interface ApplicationCreateDto {
  name: string;
  tokenKey: string;
}

export const useCreateApplication = () => {
  return useMutation({
    mutationFn: (data: ApplicationCreateDto) =>
      requestPost("application/create", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application/list"] });
    },
  });
};

export interface ApplicationUpdateDto extends Partial<ApplicationCreateDto> {
  id: string;
}

export const useUpdateApplication = () => {
  return useMutation({
    mutationFn: (data: ApplicationUpdateDto) =>
      requestPost("application/update", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application/list"] });
    },
  });
};

export const useDeleteApplication = () => {
  return useMutation({
    mutationFn: (id: string) => requestPost("application/delete", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application/list"] });
    },
  });
};
