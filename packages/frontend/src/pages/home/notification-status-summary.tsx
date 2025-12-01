import React from "react";
import {
  useGetNotificationStatusList,
  HostNotificationStatus,
  FailedEndpoint,
} from "@/services/notification";
import { Flex, Tag, Card, Tooltip, Progress } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

export const NotificationStatusSummary: React.FC = () => {
  const { data: statusData } = useGetNotificationStatusList();

  const statusList = (statusData?.data as HostNotificationStatus[]) ?? [];

  // 统计
  const totalHosts = statusList.length;
  const downHosts = statusList.filter((s) => s.currentStatus === "DOWN").length;
  const upHosts = totalHosts - downHosts;

  // 没有启用通知的服务时不显示
  if (totalHosts === 0) {
    return null;
  }

  // 获取所有故障服务
  const downServices = statusList.filter((s) => s.currentStatus === "DOWN");

  return (
    <Card size="small">
      <Flex gap={24} align="center" wrap="wrap">
        {/* 可用率 */}
        <Flex align="center" gap={12}>
          <Progress
            type="circle"
            size={48}
            percent={
              totalHosts > 0 ? Math.round((upHosts / totalHosts) * 100) : 100
            }
            status={downHosts > 0 ? "exception" : "success"}
          />
          <Flex vertical>
            <span className="text-sm text-gray-500">服务可用率</span>
            <span className="font-medium">
              {upHosts}/{totalHosts} 正常
            </span>
          </Flex>
        </Flex>

        {/* 分隔线 */}
        <div className="h-10 w-px bg-gray-200" />

        {/* 状态标签 */}
        <Flex gap={8} align="center" wrap="wrap" className="flex-1">
          {downHosts === 0 ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              所有服务运行正常
            </Tag>
          ) : (
            <>
              <Tag color="error" icon={<CloseCircleOutlined />}>
                {downHosts} 个服务故障
              </Tag>
              {downServices.map((service) => (
                <Tooltip
                  key={service.serviceId}
                  title={
                    <div>
                      <div className="font-medium mb-1">失败端点：</div>
                      {service.failedEndpoints.map((ep: FailedEndpoint) => (
                        <div key={ep.endpointId}>
                          • {ep.endpointName} (连续失败 {ep.consecutiveFailures}{" "}
                          次)
                        </div>
                      ))}
                    </div>
                  }
                >
                  <Link to={`/host-detail/${service.serviceId}`}>
                    <Tag color="warning" style={{ cursor: "pointer" }}>
                      {service.serviceName}
                    </Tag>
                  </Link>
                </Tooltip>
              ))}
            </>
          )}
        </Flex>
      </Flex>
    </Card>
  );
};
