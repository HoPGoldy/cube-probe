import { queryClient, requestPost } from "./base";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Moment, MomentListQueryDto } from "@/types/moment";
import { AppListResponse } from "@/types/global";

// 列表查询
export const useGetMomentList = (query: MomentListQueryDto) => {
  return useQuery({
    queryKey: ["moment", "list", query],
    queryFn: () => requestPost<AppListResponse<Moment>>("moments/list", query),
  });
};

// 详情查询
export const useGetMomentDetail = (id: string) => {
  return useQuery({
    queryKey: ["moment", "detail", id],
    enabled: !!id,
    queryFn: () => requestPost<Moment>("moments/detail", { id }),
  });
};

// 创建 Moment 的数据传输对象
export interface MomentCreateDto {
  name: string;
  description?: string;
  attachmentIds?: string[];
}

// 创建 Moment
export const useCreateMoment = () => {
  return useMutation({
    mutationFn: (data: MomentCreateDto) =>
      requestPost<Moment>("moments/create", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moment"] });
    },
  });
};

// 更新 Moment 的数据传输对象
export interface MomentUpdateDto extends Partial<MomentCreateDto> {
  id: string;
}

// 更新 Moment
export const useUpdateMoment = () => {
  return useMutation({
    mutationFn: (data: MomentUpdateDto) =>
      requestPost<Moment>("moments/update", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moment"] });
    },
  });
};

// 删除 Moment
export const useDeleteMoment = () => {
  return useMutation({
    mutationFn: (id: string) => requestPost("moments/delete", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moment"] });
    },
  });
};

// 获取所有标签
export const useGetMomentTags = () => {
  return useQuery({
    queryKey: ["moment", "tags"],
    queryFn: () => requestPost<string[]>("moments/tags", {}),
  });
};
