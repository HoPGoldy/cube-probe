import { queryClient, requestPost } from "./base";
import { useMutation, useQuery } from "@tanstack/react-query";

// ==================== Channel Types ====================

export interface NotificationChannel {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  webhookUrl: string;
  headers: Record<string, string> | null;
  bodyTemplate: string;
  enabled: boolean;
}

export interface ChannelCreateDto {
  name: string;
  webhookUrl: string;
  headers?: Record<string, string>;
  bodyTemplate: string;
  enabled?: boolean;
}

export interface ChannelUpdateDto extends Partial<ChannelCreateDto> {
  id: string;
}

export interface TemplateItem {
  name: string;
  description: string;
  template: string;
}

// ==================== Rule Types ====================

export type NotificationScopeType = "ALL" | "HOST" | "ENDPOINT";

export interface NotificationRule {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  enabled: boolean;
  scopeType: NotificationScopeType;
  hostId: string | null;
  endpointId: string | null;
  consecutiveFailures: number;
  cooldownMinutes: number;
  notifyOnRecovery: boolean;
  channelId: string;
  channel?: NotificationChannel;
  host?: { id: string; name: string } | null;
  endpoint?: { id: string; name: string } | null;
}

export interface RuleCreateDto {
  name: string;
  enabled?: boolean;
  scopeType?: NotificationScopeType;
  hostId?: string | null;
  endpointId?: string | null;
  consecutiveFailures?: number;
  cooldownMinutes?: number;
  notifyOnRecovery?: boolean;
  channelId: string;
}

export interface RuleUpdateDto extends Partial<RuleCreateDto> {
  id: string;
}

// ==================== Log Types ====================

export interface NotificationLog {
  id: string;
  createdAt: string;
  ruleId: string;
  endpointId: string;
  eventType: string;
  title: string;
  content: string;
  success: boolean;
  errorMsg: string | null;
}

export interface LogListQueryDto {
  ruleId?: string;
  endpointId?: string;
  limit?: number;
}

// ==================== Channel Hooks ====================

export const useGetChannelList = () => {
  return useQuery({
    queryKey: ["notification/channel/list"],
    queryFn: () => requestPost("notification/channel/list", {}),
  });
};

export const useGetChannelDetail = (id: string) => {
  return useQuery({
    queryKey: ["notification/channel/get", id],
    enabled: !!id,
    queryFn: () => requestPost("notification/channel/get", { id }),
  });
};

export const useCreateChannel = () => {
  return useMutation({
    mutationFn: (data: ChannelCreateDto) =>
      requestPost("notification/channel/create", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification/channel/list"],
      });
    },
  });
};

export const useUpdateChannel = () => {
  return useMutation({
    mutationFn: (data: ChannelUpdateDto) =>
      requestPost("notification/channel/update", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification/channel/list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["notification/channel/get"],
      });
    },
  });
};

export const useDeleteChannel = () => {
  return useMutation({
    mutationFn: (id: string) =>
      requestPost("notification/channel/delete", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification/channel/list"],
      });
    },
  });
};

export const useTestChannel = () => {
  return useMutation({
    mutationFn: (id: string) =>
      requestPost("notification/channel/test", { id }),
  });
};

export const useGetChannelTemplates = () => {
  return useQuery({
    queryKey: ["notification/channel/templates"],
    queryFn: () => requestPost("notification/channel/templates", {}),
  });
};

// ==================== Rule Hooks ====================

export const useGetRuleList = () => {
  return useQuery({
    queryKey: ["notification/rule/list"],
    queryFn: () => requestPost("notification/rule/list", {}),
  });
};

export const useGetRuleDetail = (id: string) => {
  return useQuery({
    queryKey: ["notification/rule/get", id],
    enabled: !!id,
    queryFn: () => requestPost("notification/rule/get", { id }),
  });
};

export const useCreateRule = () => {
  return useMutation({
    mutationFn: (data: RuleCreateDto) =>
      requestPost("notification/rule/create", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification/rule/list"] });
    },
  });
};

export const useUpdateRule = () => {
  return useMutation({
    mutationFn: (data: RuleUpdateDto) =>
      requestPost("notification/rule/update", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification/rule/list"] });
      queryClient.invalidateQueries({ queryKey: ["notification/rule/get"] });
    },
  });
};

export const useDeleteRule = () => {
  return useMutation({
    mutationFn: (id: string) => requestPost("notification/rule/delete", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification/rule/list"] });
    },
  });
};

// ==================== Log Hooks ====================

export const useGetLogList = (query?: LogListQueryDto) => {
  return useQuery({
    queryKey: ["notification/log/list", query],
    queryFn: () => requestPost("notification/log/list", query || {}),
  });
};
