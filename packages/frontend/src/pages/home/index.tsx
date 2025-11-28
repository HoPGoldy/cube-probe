import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useDeleteMonitoredHost,
  useGetMonitoredHostList,
  useUpdateMonitoredHost,
} from "@/services/monitored-host";
import { Card, Spin, Flex, Space, Button, Modal, Switch } from "antd";
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

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [modal, contextHolder] = Modal.useModal();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: hostsData, isLoading } = useGetMonitoredHostList({});

  const { mutateAsync: updateHost } = useUpdateMonitoredHost();
  const { mutateAsync: deleteHost } = useDeleteMonitoredHost();

  const hosts = hostsData?.data ?? [];

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

  const onSwitchEnabled = async (item: any) => {
    await updateHost({
      id: item.id,
      enabled: !item.enabled,
    });
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
    return (
      <Card
        key={host.id}
        styles={{ body: { padding: 16 } }}
        onClick={() => onHostClick(host.id)}
      >
        <Flex className="w-full" justify="space-between" align="center">
          <div className="flex-1">
            <Flex gap={16} justify="space-between" align="center">
              <Flex className="text-2xl font-bold" align="center" gap={8}>
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    host.enabled ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                {host.name}
              </Flex>
              <Space onClick={(e) => e.stopPropagation()}>
                <Switch
                  checkedChildren="已启用"
                  unCheckedChildren="已禁用"
                  checked={host.enabled}
                  onChange={() => onSwitchEnabled(host)}
                />
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
