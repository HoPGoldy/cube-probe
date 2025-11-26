import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  useDeleteMonitoredHost,
  useGetMonitoredHostDetail,
  useUpdateMonitoredHost,
} from "@/services/monitored-host";
import {
  useDeleteEndpoint,
  useGetEndpointList,
  useUpdateEndpoint,
} from "@/services/monitored-endpoint";
import { Card, Spin, Empty, Flex, Space, Button, Modal, Switch } from "antd";
import { usePageTitle } from "@/store/global";
import { utcdayjsFormat } from "@/utils/dayjs";
import { EmptyTip } from "@/components/empty-tip";
import { EndpointChart } from "./endpoint-chart";
import {
  DETAIL_TYPE_KEY as EP_DETAIL_TYPE_KEY,
  DETAIL_ID_KEY as EP_DETAIL_ID_KEY,
  EndpointDetailModal,
} from "./detail-endpoint";
import { DetailPageType } from "@/utils/use-detail-type";
import { CloseOutlined } from "@ant-design/icons";
import {
  DETAIL_TYPE_KEY as HOST_DETAIL_TYPE_KEY,
  DETAIL_ID_KEY as HOST_DETAIL_ID_KEY,
  HostDetailModal,
} from "./detail-host";

const HostDetailPage: React.FC = () => {
  const { hostId } = useParams<{ hostId: string }>();
  const [modal, contextHolder] = Modal.useModal();
  const [searchParams, setSearchParams] = useSearchParams();

  const { hostDetail, isLoading: loadingHost } = useGetMonitoredHostDetail(
    hostId || "",
  );

  const { data: endpointsData, isLoading: loadingEndpoints } =
    useGetEndpointList({
      serviceId: hostId,
    });

  const { mutateAsync: updateHost } = useUpdateMonitoredHost();
  const { mutateAsync: deleteHost } = useDeleteMonitoredHost();
  const { mutateAsync: updateEndpoint } = useUpdateEndpoint();
  const { mutateAsync: deleteEndpoint } = useDeleteEndpoint();

  const endpoints = endpointsData?.data ?? [];

  usePageTitle(hostDetail ? `${hostDetail?.name} - 监控详情` : "监控详情");

  const onAddEndpoint = () => {
    searchParams.set(EP_DETAIL_TYPE_KEY, DetailPageType.Add);
    setSearchParams(searchParams, { replace: true });
  };

  const onEditEndpoint = (id: string) => {
    searchParams.set(EP_DETAIL_TYPE_KEY, DetailPageType.Edit);
    searchParams.set(EP_DETAIL_ID_KEY, id);
    setSearchParams(searchParams, { replace: true });
  };

  const onSwitchEndpointEnabled = async (item: any) => {
    await updateEndpoint({
      id: item.id,
      enabled: !item.enabled,
    });
  };

  const onEndpointDeleteConfirm = async (item: any) => {
    modal.confirm({
      title: `确认删除端点"${item.name}"？`,
      content: "删除后该端点的所有探测记录也将被删除",
      onOk: async () => {
        await deleteEndpoint(item.id);
      },
    });
  };

  const onEditHost = (id: string) => {
    searchParams.set(HOST_DETAIL_TYPE_KEY, DetailPageType.Edit);
    searchParams.set(HOST_DETAIL_ID_KEY, id);
    setSearchParams(searchParams, { replace: true });
  };

  const onSwitchEnabled = async (item: any) => {
    await updateHost({
      id: item.id,
      enabled: !item.enabled,
    });
  };

  const onHostDeleteConfirm = async (item: any) => {
    modal.confirm({
      title: `确认删除服务"${item.name}"？`,
      content: "删除后该服务下的所有监控端点也将被删除",
      onOk: async () => {
        await deleteHost(item.id);
      },
    });
  };

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
              </Flex>
              <Space>
                <Switch
                  checkedChildren="已启用"
                  unCheckedChildren="已禁用"
                  checked={endpoint.enabled}
                  onChange={() => onSwitchEndpointEnabled(endpoint)}
                />
                <Button onClick={() => onEditEndpoint(endpoint.id)}>
                  配置
                </Button>
                <Button>复制</Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => onEndpointDeleteConfirm(endpoint)}
                ></Button>
              </Space>
            </Flex>
            <div>{endpoint.url}</div>
          </div>
        </Flex>
        {/* 探测结果图表 */}
        <div className="mt-4 w-full h-[70px]">
          <EndpointChart
            endpointId={endpoint.id}
            refetchInterval={endpoint.intervalTime * 1000}
          />
        </div>
      </Card>
    );
  };

  return (
    <>
      <Flex vertical gap={16} className="m-4">
        <div>
          <Flex gap={16} justify="space-between" align="center">
            <div className="text-4xl font-bold">{hostDetail?.name}</div>
            <Space>
              <Switch
                checkedChildren="已启用"
                unCheckedChildren="已禁用"
                checked={hostDetail.enabled}
                onChange={() => onSwitchEnabled(hostDetail)}
              />
              <Button type="primary" onClick={onAddEndpoint}>
                创建接口
              </Button>
              <Button onClick={() => onEditHost(hostDetail.id)}>编辑</Button>
              <Button>复制</Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => onHostDeleteConfirm(hostDetail)}
              ></Button>
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
              className="mt-8"
              title="暂未配置监控接口"
              subTitle="点击右上角“创建接口”按钮继续"
            />
          ) : (
            endpoints.map(renderEndPointItem)
          )}
        </Flex>
      </Flex>

      <EndpointDetailModal />
      <HostDetailModal />
      {contextHolder}
    </>
  );
};

export default HostDetailPage;
