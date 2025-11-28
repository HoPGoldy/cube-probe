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
