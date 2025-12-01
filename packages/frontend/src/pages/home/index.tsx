import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useDeleteMonitoredHost,
  useGetMonitoredHostList,
} from "@/services/monitored-host";
import { useGetNotificationStatusList } from "@/services/notification";
import { Card, Spin, Flex, Space, Button, Modal } from "antd";
import { usePageTitle } from "@/store/global";
import { utcdayjsFormat } from "@/utils/dayjs";
import { EmptyTip } from "@/components/empty-tip";
import { CloseOutlined } from "@ant-design/icons";
import {
  DETAIL_TYPE_KEY as HOST_DETAIL_TYPE_KEY,
  DETAIL_ID_KEY as HOST_DETAIL_ID_KEY,
  HostDetailModal,
} from "@/pages/host-detail/detail-host";
import { DetailPageType } from "@/utils/use-detail-type";
import { NotificationStatusSummary } from "./notification-status-summary";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [modal, contextHolder] = Modal.useModal();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: hostsData, isLoading } = useGetMonitoredHostList({});
  const { data: statusData } = useGetNotificationStatusList();

  const { mutateAsync: deleteHost } = useDeleteMonitoredHost();

  const hosts = hostsData?.data ?? [];
  const statusList = statusData?.data ?? [];

  // 根据通知状态获取 Host 的展示状态
  const getHostDisplayStatus = (
    hostId: string,
  ): "UP" | "WARNING" | "DOWN" | "DISABLED" => {
    const host = hosts.find((h: any) => h.id === hostId);
    if (!host?.enabled) {
      return "DISABLED";
    }

    const status = statusList.find((s: any) => s.serviceId === hostId);
    if (!status) {
      return "UP"; // 未启用通知的服务默认显示正常
    }

    if (status.currentStatus === "DOWN") {
      return "DOWN";
    }

    if (status.currentStatus === "UP" && status.failedEndpoints.length > 0) {
      return "WARNING";
    }

    return "UP";
  };

  // 状态对应的颜色
  const statusColorMap = {
    UP: "bg-green-500",
    WARNING: "bg-yellow-500",
    DOWN: "bg-red-500",
    DISABLED: "bg-gray-400",
  };

  usePageTitle("监控首页");

  const onAddHost = () => {
    searchParams.set(HOST_DETAIL_TYPE_KEY, DetailPageType.Add);
    setSearchParams(searchParams, { replace: true });
  };

  const onEditHost = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    searchParams.set(HOST_DETAIL_TYPE_KEY, DetailPageType.Edit);
    searchParams.set(HOST_DETAIL_ID_KEY, id);
    setSearchParams(searchParams, { replace: true });
  };

  const onHostDeleteConfirm = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    modal.confirm({
      title: `确认删除服务"${item.name}"？`,
      content: "删除后该服务下的所有监控端点也将被删除",
      onOk: async () => {
        await deleteHost(item.id);
      },
    });
  };

  const onHostClick = (hostId: string) => {
    navigate(`/host-detail/${hostId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  const renderHostItem = (host: any) => {
    const displayStatus = getHostDisplayStatus(host.id);

    return (
      <Card
        key={host.id}
        className="hover:ring-2 ring-gray-300 dark:ring-neutral-500 transition-all cursor-pointer"
        styles={{ body: { padding: 16 } }}
        onClick={() => onHostClick(host.id)}
      >
        <Flex className="w-full" justify="space-between" align="center">
          <div className="flex-1">
            <Flex gap={16} justify="space-between" align="center">
              <Flex className="text-2xl font-bold" align="center" gap={8}>
                <span
                  className={`inline-block w-3 h-3 rounded-full ${statusColorMap[displayStatus]}`}
                />
                {host.name}
              </Flex>
              <Space onClick={(e) => e.stopPropagation()}>
                <Button onClick={(e) => onEditHost(host.id, e)}>编辑</Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={(e) => onHostDeleteConfirm(host, e)}
                />
              </Space>
            </Flex>
            <div className="mt-2 text-gray-500">
              {host.url && <span className="mr-4">{host.url}</span>}
              <span>创建时间: {utcdayjsFormat(host.createdAt)}</span>
            </div>
          </div>
        </Flex>
      </Card>
    );
  };

  return (
    <>
      <Flex vertical gap={16} className="m-4">
        <div>
          <Flex gap={16} justify="space-between" align="center">
            <div className="text-4xl font-bold">监控服务</div>
            <Space>
              <Button type="primary" onClick={onAddHost}>
                创建服务
              </Button>
            </Space>
          </Flex>
          <div className="mt-2 text-gray-500">
            管理和监控您的所有服务健康状态
          </div>
        </div>

        {/* 通知状态摘要 */}
        <NotificationStatusSummary />

        {/* Hosts 列表 */}
        <Flex vertical gap={16}>
          {hosts.length === 0 ? (
            <EmptyTip
              className="mt-8"
              title="暂无监控服务"
              subTitle={'点击右上角"创建服务"按钮开始添加'}
            />
          ) : (
            hosts.map(renderHostItem)
          )}
        </Flex>
      </Flex>

      <HostDetailModal />
      {contextHolder}
    </>
  );
};

export default HomePage;
