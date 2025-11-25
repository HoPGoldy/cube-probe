import React from "react";
import { useParams } from "react-router-dom";
import { useGetMonitoredHostDetail } from "@/services/monitored-host";
import { useGetEndpointList } from "@/services/monitored-endpoint";
import { Card, Spin, Empty, Tag, Flex, Space, Button } from "antd";
import { usePageTitle } from "@/store/global";
import { utcdayjsFormat } from "@/utils/dayjs";
import { EmptyTip } from "@/components/empty-tip";
import { EndpointChart } from "./endpoint-chart";

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
          <EmptyTip
            className="mt-4"
            title="暂未配置监控接口"
            subTitle="点击下方按钮创建接口"
            extra={
              <Button type="primary" className="mt-2">
                创建接口
              </Button>
            }
          />
        ) : (
          endpoints.map(renderEndPointItem)
        )}
      </Flex>
    </Flex>
  );
};

export default HostDetailPage;
