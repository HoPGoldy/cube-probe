import React from "react";
import { useParams } from "react-router-dom";
import { useGetMonitoredHostList } from "@/services/monitored-host";
import { useGetEndpointList } from "@/services/monitored-endpoint";
import { useGetProbeResultListByEndpoint } from "@/services/probe-result";
import { Card, Descriptions, Spin, Empty, Tag } from "antd";
import { Column } from "@ant-design/plots";
import { usePageTitle } from "@/store/global";

import { utcdayjsFormat } from "@/utils/dayjs";

interface EndpointChartProps {
  endpointId: string;
}

const EndpointChart: React.FC<EndpointChartProps> = ({ endpointId }) => {
  const { data: resultsData } = useGetProbeResultListByEndpoint(endpointId, 50);
  const results = resultsData?.data ?? [];

  if (results.length === 0) {
    return (
      <Empty description="暂无探测数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    );
  }

  const chartData = results
    .sort(
      (a: any, b: any) =>
        new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime(),
    )
    .map((r: any) => ({
      time: utcdayjsFormat(r.checkedAt, "MM-DD HH:mm"),
      responseTime: r.responseTime || 0,
      status: r.success ? "成功" : "失败",
    }));

  const config = {
    data: chartData,
    xField: "time",
    yField: "responseTime",
    seriesField: "status",
    color: ({ status }: any) => {
      return status === "成功" ? "#52c41a" : "#ff4d4f";
    },
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    tooltip: {
      customContent: (title: string, items: any[]) => {
        if (!items || items.length === 0) return "";
        const item = items[0];
        return `
          <div style="padding: 8px;">
            <div><strong>时间:</strong> ${title}</div>
            <div><strong>响应时间:</strong> ${item.data.responseTime}ms</div>
            <div><strong>状态:</strong> ${item.data.status}</div>
          </div>
        `;
      },
    },
    yAxis: {
      title: {
        text: "响应时间 (ms)",
      },
    },
    xAxis: {
      title: {
        text: "探测时间",
      },
      label: {
        autoRotate: true,
        autoHide: true,
      },
    },
    height: 200,
  };

  return <Column {...config} />;
};

const HostDetailPage: React.FC = () => {
  const { hostId } = useParams<{ hostId: string }>();

  const { data: hostsData, isLoading: loadingHost } = useGetMonitoredHostList(
    {},
  );
  const { data: endpointsData, isLoading: loadingEndpoints } =
    useGetEndpointList({
      serviceId: hostId,
    });

  const host = hostsData?.data?.find((h: any) => h.id === hostId);
  const endpoints = endpointsData?.data ?? [];

  usePageTitle(host ? `${host.name} - 监控详情` : "监控详情");

  if (loadingHost || loadingEndpoints) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (!host) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty description="未找到该监控服务" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Host 基本信息 */}
      <Card title="监控服务信息" className="shadow-sm">
        <Descriptions column={3} bordered>
          <Descriptions.Item label="服务名称">{host.name}</Descriptions.Item>
          <Descriptions.Item label="主机地址">{host.host}</Descriptions.Item>
          <Descriptions.Item label="端口">{host.port}</Descriptions.Item>
          <Descriptions.Item label="创建时间" span={3}>
            {utcdayjsFormat(host.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间" span={3}>
            {utcdayjsFormat(host.updatedAt)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Endpoints 列表 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">监控端点</h2>
        {endpoints.length === 0 ? (
          <Empty description="该服务暂无监控端点" />
        ) : (
          endpoints.map((endpoint: any) => (
            <Card
              key={endpoint.id}
              title={
                <div className="flex items-center justify-between">
                  <span>{endpoint.name}</span>
                  {endpoint.enabled ? (
                    <Tag color="green">已启用</Tag>
                  ) : (
                    <Tag color="red">已禁用</Tag>
                  )}
                </div>
              }
              className="shadow-sm"
            >
              {/* Endpoint 基本信息 */}
              <Descriptions column={2} size="small" className="mb-4">
                <Descriptions.Item label="URL">
                  {endpoint.url}
                </Descriptions.Item>
                <Descriptions.Item label="超时时间">
                  {endpoint.timeout}ms
                </Descriptions.Item>
                <Descriptions.Item label="请求方法">
                  {endpoint.method || "GET"}
                </Descriptions.Item>
                <Descriptions.Item label="Cron表达式">
                  {endpoint.cronExpression}
                </Descriptions.Item>
                <Descriptions.Item label="更新时间" span={2}>
                  {utcdayjsFormat(endpoint.updatedAt)}
                </Descriptions.Item>
              </Descriptions>

              {/* 探测结果图表 */}
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2 text-gray-600">
                  最近探测记录 (响应时间)
                </h4>
                <EndpointChart endpointId={endpoint.id} />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default HostDetailPage;
