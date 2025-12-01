import React from "react";
import {
  useGetNotificationStatusList,
  HostNotificationStatus,
  FailedEndpoint,
} from "@/services/notification";
import { Button, Flex, Table, Tag, Card, Empty, Tooltip, Progress } from "antd";
import { ColumnType } from "antd/es/table";
import { utcdayjsFormat } from "@/utils/dayjs";
import {
  RedoOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { usePageTitle } from "@/store/global";
import { Link } from "react-router-dom";

const NotificationStatusPage: React.FC = () => {
  usePageTitle("通知状态");

  const {
    data: statusData,
    refetch: reloadStatus,
    isFetching: loadingStatus,
  } = useGetNotificationStatusList();

  const statusList = (statusData?.data as HostNotificationStatus[]) ?? [];

  // 统计
  const totalHosts = statusList.length;
  const downHosts = statusList.filter((s) => s.currentStatus === "DOWN").length;
  const upHosts = totalHosts - downHosts;

  const columns: ColumnType<HostNotificationStatus>[] = [
    {
      title: "服务名称",
      dataIndex: "serviceName",
      width: 200,
      render: (text: string, record: HostNotificationStatus) => (
        <Link to={`/host-detail/${record.serviceId}`}>{text}</Link>
      ),
    },
    {
      title: "当前状态",
      dataIndex: "currentStatus",
      width: 120,
      align: "center",
      render: (status: "UP" | "DOWN") => (
        <Tag
          color={status === "UP" ? "success" : "error"}
          icon={
            status === "UP" ? <CheckCircleOutlined /> : <CloseCircleOutlined />
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "失败端点",
      dataIndex: "failedEndpoints",
      render: (endpoints: FailedEndpoint[]) => {
        if (endpoints.length === 0) {
          return <span className="text-gray-400">无</span>;
        }
        return (
          <Flex wrap="wrap" gap={4}>
            {endpoints.map((ep) => (
              <Tooltip
                key={ep.endpointId}
                title={`连续失败 ${ep.consecutiveFailures} 次`}
              >
                <Tag color="warning">
                  {ep.endpointName} ({ep.consecutiveFailures})
                </Tag>
              </Tooltip>
            ))}
          </Flex>
        );
      },
    },
    {
      title: "上次通知时间",
      dataIndex: "lastNotifiedAt",
      width: 180,
      render: (text: string | null) => (text ? utcdayjsFormat(text) : "-"),
    },
  ];

  return (
    <Flex vertical gap={16} className="p-4">
      {/* 统计卡片 */}
      <Flex gap={16}>
        <Card size="small" style={{ minWidth: 150 }}>
          <Flex vertical align="center">
            <span className="text-gray-500 text-sm">总服务数</span>
            <span className="text-2xl font-bold">{totalHosts}</span>
          </Flex>
        </Card>
        <Card size="small" style={{ minWidth: 150 }}>
          <Flex vertical align="center">
            <span className="text-gray-500 text-sm">正常</span>
            <span className="text-2xl font-bold text-green-500">{upHosts}</span>
          </Flex>
        </Card>
        <Card size="small" style={{ minWidth: 150 }}>
          <Flex vertical align="center">
            <span className="text-gray-500 text-sm">故障</span>
            <span className="text-2xl font-bold text-red-500">{downHosts}</span>
          </Flex>
        </Card>
        <Card size="small" style={{ minWidth: 200 }}>
          <Flex vertical align="center">
            <span className="text-gray-500 text-sm">可用率</span>
            <Progress
              type="circle"
              size={50}
              percent={
                totalHosts > 0 ? Math.round((upHosts / totalHosts) * 100) : 100
              }
              status={downHosts > 0 ? "exception" : "success"}
            />
          </Flex>
        </Card>
      </Flex>

      {/* 操作栏 */}
      <Flex justify="space-between" align="center">
        <span className="text-gray-500 text-sm">
          仅显示启用通知的服务，每 10 秒自动刷新
        </span>
        <Button
          onClick={() => reloadStatus()}
          icon={<RedoOutlined />}
          loading={loadingStatus}
        >
          刷新
        </Button>
      </Flex>

      {/* 状态表格 */}
      {statusList.length === 0 ? (
        <Card>
          <Empty description="暂无启用通知的服务" />
        </Card>
      ) : (
        <Table
          bordered
          size="small"
          columns={columns}
          dataSource={statusList}
          loading={loadingStatus}
          rowKey="serviceId"
          pagination={false}
          rowClassName={(record) =>
            record.currentStatus === "DOWN" ? "bg-red-50" : ""
          }
        />
      )}
    </Flex>
  );
};

export default NotificationStatusPage;
