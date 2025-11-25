import { Echarts } from "@/components/echarts";
import { EmptyTip } from "@/components/empty-tip";
import { useGetProbeResultListByEndpoint } from "@/services/probe-result";
import { utcdayjsFormat } from "@/utils/dayjs";
import { FC } from "react";

interface EndpointChartProps {
  endpointId: string;
}

const MAX_DATA_POINTS = 50;

export const EndpointChart: FC<EndpointChartProps> = ({ endpointId }) => {
  const { data: resultsData } = useGetProbeResultListByEndpoint(
    endpointId,
    MAX_DATA_POINTS,
  );
  const results = (resultsData?.data ?? []).map((item) => ({
    ...item,
    time: utcdayjsFormat(item.createdAt, "MM-DD HH:mm"),
    responseTime: item.responseTime,
    status: item.success ? "成功" : "失败",
  }));
  console.log("results", results);

  if (results.length === 0) {
    return <EmptyTip title="暂无探测数据" />;
  }

  // 计算最大响应时间，用于失败时的柱子高度
  const maxResponseTime = Math.max(...results.map((d) => d.responseTime));

  const options = {
    animation: true,
    animationDuration: 800,
    animationEasing: "cubicOut" as const,
    animationDurationUpdate: 800,
    animationEasingUpdate: "cubicOut" as const,
    tooltip: {
      trigger: "axis" as const,
      axisPointer: {
        type: "shadow" as const,
      },
      formatter: (params: any) => {
        const item = params[0];
        const dataIndex = item.dataIndex;
        const originalData = results[dataIndex];
        return `
          <div style="padding: 4px 8px;">
            <div><strong>时间:</strong> ${originalData.time}</div>
            <div><strong>响应时间:</strong> ${originalData.responseTime}ms</div>
            <div><strong>状态:</strong> ${originalData.status}</div>
          </div>
        `;
      },
    },
    legend: {
      show: false,
    },
    grid: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    xAxis: {
      type: "category" as const,
      data: results.map((d) => d.time),
      show: false,
    },
    yAxis: {
      type: "value" as const,
      show: false,
    },
    series: [
      {
        type: "bar" as const,
        data: results.map((d) => ({
          value: d.status === "失败" ? maxResponseTime : d.responseTime,
          itemStyle: {
            color: d.status === "成功" ? "#52c41a" : "#ff4d4f",
          },
        })),
      },
    ],
  };

  return <Echarts options={options} />;
};
