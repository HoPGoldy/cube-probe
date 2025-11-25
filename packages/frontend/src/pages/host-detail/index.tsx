import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useGetMonitoredHostDetail } from "@/services/monitored-host";
import { useGetEndpointList } from "@/services/monitored-endpoint";
import { useGetProbeResultListByEndpoint } from "@/services/probe-result";
import { Card, Spin, Empty, Tag, Flex, Space, Button } from "antd";
import { usePageTitle } from "@/store/global";
import { Echarts } from "@/components/echarts";

import { utcdayjsFormat } from "@/utils/dayjs";

interface EndpointChartProps {
  endpointId: string;
}

const MAX_DATA_POINTS = 50;

const EndpointChart: React.FC<EndpointChartProps> = ({ endpointId }) => {
  const { data: resultsData } = useGetProbeResultListByEndpoint(endpointId, 50);
  const results = resultsData?.data ?? [];

  const [chartData, setChartData] = useState<any[]>([]);
  const prevResultsRef = useRef<any[]>([]);

  useEffect(() => {
    if (results.length === 0) return;

    const newResults = results
      .sort(
        (a: any, b: any) =>
          new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime(),
      )
      .map((r: any) => ({
        id: r.id,
        time: utcdayjsFormat(r.checkedAt, "MM-DD HH:mm"),
        responseTime: r.responseTime || 0,
        status: r.success ? "成功" : "失败",
      }));

    // 初始化数据
    if (chartData.length === 0) {
      setChartData(newResults.slice(-MAX_DATA_POINTS));
      prevResultsRef.current = newResults;
      return;
    }

    // 找出新数据：从老数据的最后一个id开始查找
    const lastId =
      prevResultsRef.current[prevResultsRef.current.length - 1]?.id;
    if (!lastId) {
      setChartData(newResults.slice(-MAX_DATA_POINTS));
      prevResultsRef.current = newResults;
      return;
    }

    // 找到老数据最后一个id在新数组中的位置
    const lastIndex = newResults.findIndex((r) => r.id === lastId);

    // 如果找到了，lastIndex+1 之后的就是新数据
    if (lastIndex !== -1 && lastIndex < newResults.length - 1) {
      const newItems = newResults.slice(lastIndex + 1);

      if (newItems.length > 0) {
        // 有新数据，使用 push/shift 方式更新
        setChartData((prev) => {
          const updated = [...prev];

          // 添加新数据到末尾
          newItems.forEach((item) => {
            updated.push(item);
          });

          // 如果超过最大数量，从开头移除
          while (updated.length > MAX_DATA_POINTS) {
            updated.shift();
          }

          return updated;
        });
      }
    }

    prevResultsRef.current = newResults;
  }, [results]);

  if (chartData.length === 0) {
    return (
      <Empty description="暂无探测数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    );
  }

  // 计算最大响应时间，用于失败时的柱子高度
  const maxResponseTime = Math.max(...chartData.map((d) => d.responseTime));

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
        const originalData = chartData[dataIndex];
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
      data: chartData.map((d) => d.time),
      show: false,
    },
    yAxis: {
      type: "value" as const,
      show: false,
    },
    series: [
      {
        type: "bar" as const,
        data: chartData.map((d) => ({
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

const HostDetailPage: React.FC = () => {
  const { hostId } = useParams<{ hostId: string }>();

  const { hostDetail, isLoading: loadingHost } = useGetMonitoredHostDetail(
    hostId || "",
  );

  const { data: endpointsData, isLoading: loadingEndpoints } =
    useGetEndpointList({
      serviceId: hostId,
    });

  const endpoints = endpointsData?.data ?? [];

  usePageTitle(hostDetail ? `${hostDetail?.name} - 监控详情` : "监控详情");

  if (loadingHost || loadingEndpoints) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (!hostDetail) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty description="未找到该监控服务" />
      </div>
    );
  }

  const renderEndPointItem = (endpoint: any) => {
    return (
      <Card key={endpoint.id} styles={{ body: { padding: 16 } }}>
        <Flex className="w-full">
          <div className="w-full">
            <Flex gap={16} justify="space-between" align="center">
              <Flex className="text-2xl font-bold" align="center" gap={8}>
                {endpoint.name}
                {endpoint.enabled ? (
                  <Tag color="green">已启用</Tag>
                ) : (
                  <Tag color="red">已禁用</Tag>
                )}
              </Flex>
              <Space>
                <Button>暂停</Button>
                <Button>编辑</Button>
                <Button>复制</Button>
                <Button danger>删除</Button>
              </Space>
            </Flex>
            <div>{endpoint.url}</div>
          </div>
        </Flex>
        {/* 探测结果图表 */}
        <div className="mt-4 w-full h-[70px]">
          <EndpointChart endpointId={endpoint.id} />
        </div>
      </Card>
    );
  };

  return (
    <Flex vertical gap={16} className="m-4">
      <div>
        <Flex gap={16} justify="space-between" align="center">
          <div className="text-4xl font-bold">{hostDetail?.name}</div>
          <Space>
            <Button>暂停所有</Button>
            <Button>编辑</Button>
            <Button>复制</Button>
            <Button danger>删除</Button>
          </Space>
        </Flex>
        <div className="mt-2 text-gray-500">
          创建时间: {utcdayjsFormat(hostDetail?.createdAt)} | 更新时间:{" "}
          {utcdayjsFormat(hostDetail?.updatedAt)}
        </div>
      </div>

      {/* Endpoints 列表 */}
      <Flex vertical gap={16}>
        {endpoints.length === 0 ? (
          <Empty description="该服务暂无监控端点" />
        ) : (
          endpoints.map(renderEndPointItem)
        )}
      </Flex>
    </Flex>
  );
};

export default HostDetailPage;
