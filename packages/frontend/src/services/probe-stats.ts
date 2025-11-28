import { requestPost } from "./base";
import { useQuery } from "@tanstack/react-query";

// 多时间范围统计响应类型
export interface MultiRangeStatsResponse {
  endpointId: string;
  current: {
    responseTime: number | null;
    success: boolean | null;
    timestamp: string | null;
  };
  stats24h: {
    totalChecks: number;
    successCount: number;
    uptimePercentage: number | null;
    avgResponseTime: number | null;
  };
  stats30d: {
    totalChecks: number;
    successCount: number;
    uptimePercentage: number | null;
  };
  stats1y: {
    totalChecks: number;
    successCount: number;
    uptimePercentage: number | null;
  };
}

export const useGetEndpointMultiRangeStats = (endpointId: string) => {
  return useQuery({
    queryKey: ["probe-stats/endpoint/multi-range", endpointId],
    enabled: !!endpointId,
    queryFn: () =>
      requestPost<MultiRangeStatsResponse>("probe-stats/endpoint/multi-range", {
        endpointId,
      }),
  });
};

// Host 多时间范围统计响应类型
export interface HostMultiRangeStatsResponse {
  serviceId: string;
  endpointCount: number;
  current: {
    avgResponseTime: number | null;
    successRate: number | null;
    timestamp: string | null;
  };
  stats24h: {
    totalChecks: number;
    successCount: number;
    uptimePercentage: number | null;
    avgResponseTime: number | null;
  };
  stats30d: {
    totalChecks: number;
    successCount: number;
    uptimePercentage: number | null;
  };
  stats1y: {
    totalChecks: number;
    successCount: number;
    uptimePercentage: number | null;
  };
}

export const useGetHostMultiRangeStats = (serviceId: string) => {
  return useQuery({
    queryKey: ["probe-stats/host/multi-range", serviceId],
    enabled: !!serviceId,
    queryFn: () =>
      requestPost<HostMultiRangeStatsResponse>("probe-stats/host/multi-range", {
        serviceId,
      }),
  });
};
