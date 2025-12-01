import React, { useState } from "react";
import { Card, Flex, Space, Button, Switch, message } from "antd";
import {
  CloseOutlined,
  DownOutlined,
  UpOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { EndpointChart } from "./endpoint-chart";
import { useGetEndpointMultiRangeStats } from "@/services/probe-stats";
import { StatCard, getUptimeColor } from "@/components/stat-card";
import { useCopyEndpoint } from "@/services/monitored-endpoint";

interface EndpointItemProps {
  endpoint: any;
  onEdit: (id: string) => void;
  onSwitchEnabled: (item: any) => void;
  onDelete: (item: any) => void;
}

export const EndpointItem: React.FC<EndpointItemProps> = ({
  endpoint,
  onEdit,
  onSwitchEnabled,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { data: statsData } = useGetEndpointMultiRangeStats(endpoint.id);
  const stats = statsData?.data;

  const { mutateAsync: copyEndpoint, isPending: copying } = useCopyEndpoint();

  const hasData =
    stats &&
    (stats.current.responseTime !== null || stats.stats24h.totalChecks > 0);

  const handleCopy = async () => {
    try {
      await copyEndpoint(endpoint.id);
      message.success("复制成功，新端点已创建（默认禁用）");
    } catch {
      message.error("复制失败");
    }
  };

  return (
    <Card styles={{ body: { padding: 16 } }}>
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
                onChange={() => onSwitchEnabled(endpoint)}
              />
              <Button onClick={() => onEdit(endpoint.id)}>配置</Button>
              <Button
                icon={<CopyOutlined />}
                loading={copying}
                onClick={handleCopy}
              >
                复制
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => onDelete(endpoint)}
              ></Button>
              <Button
                icon={expanded ? <UpOutlined /> : <DownOutlined />}
                onClick={() => setExpanded(!expanded)}
              ></Button>
            </Space>
          </Flex>
          <div className="text-gray-500">{endpoint.url}</div>

          {/* 统计指标 */}
          {expanded && hasData && (
            <Flex
              gap={16}
              className="mt-3"
              align="center"
              justify="space-around"
            >
              <StatCard
                label="平均响应时间"
                subLabel="24小时"
                value={
                  stats.stats24h.avgResponseTime !== null
                    ? stats.stats24h.avgResponseTime.toFixed(2)
                    : null
                }
                unit=" ms"
              />
              <StatCard
                label="在线时间"
                subLabel="24小时"
                value={stats.stats24h.uptimePercentage?.toFixed(2) ?? null}
                unit="%"
                colorClass={getUptimeColor(stats.stats24h.uptimePercentage)}
              />
              <StatCard
                label="在线时间"
                subLabel="30天"
                value={stats.stats30d.uptimePercentage?.toFixed(2) ?? null}
                unit="%"
                colorClass={getUptimeColor(stats.stats30d.uptimePercentage)}
              />
              <StatCard
                label="在线时间"
                subLabel="1年"
                value={stats.stats1y.uptimePercentage?.toFixed(2) ?? null}
                unit="%"
                colorClass={getUptimeColor(stats.stats1y.uptimePercentage)}
              />
            </Flex>
          )}
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
