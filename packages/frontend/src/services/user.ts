import { CommonListQueryDto } from "@/types/global";
import { queryClient, requestPost } from "./base";
import { useMutation, useQuery } from "@tanstack/react-query";

export interface UserListQueryDto extends CommonListQueryDto {}

export const useGetUserList = (query: UserListQueryDto) => {
  return useQuery({
    queryKey: ["user/list", query],
    queryFn: () => requestPost("user/list", query),
  });
};

export const useGetUserDetail = (id: string) => {
  return useQuery({
    queryKey: ["user/detail", id],
    enabled: !!id,
    queryFn: () => requestPost("user/detail", { id }),
  });
};

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

export interface UserCreateDto {
  username: string;
  email?: string;
  phone?: string;
  role: UserRole;
  passwordHash: string;
}

export const useCreateUser = () => {
  return useMutation({
    mutationFn: (data: UserCreateDto) => requestPost("user/create", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user/list"] });
    },
  });
};

export interface UserUpdateDto extends Partial<UserCreateDto> {
  id: string;
  isBanned?: boolean;
}

export const useUpdateUser = () => {
  return useMutation({
    mutationFn: (data: UserUpdateDto) => requestPost("user/update", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user/list"] });
    },
  });
};

export const useDeleteUser = () => {
  return useMutation({
    mutationFn: (id: string) => requestPost("user/delete", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user/list"] });
    },
  });
};

export interface ChangePasswordReqData {
  newP: string;
  oldP: string;
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordReqData) =>
      requestPost("user/change-password", data),
  });
};
