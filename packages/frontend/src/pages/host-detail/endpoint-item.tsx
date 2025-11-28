import React, { useState } from "react";
import { Card, Flex, Space, Button, Switch } from "antd";
import { CloseOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
import { EndpointChart } from "./endpoint-chart";
import { useGetEndpointMultiRangeStats } from "@/services/probe-stats";

interface EndpointItemProps {
  endpoint: any;
  onEdit: (id: string) => void;
  onSwitchEnabled: (item: any) => void;
  onDelete: (item: any) => void;
}

// 统计指标卡片组件
const StatCard: React.FC<{
  label: string;
  subLabel?: string;
  value: string | number | null;
  unit?: string;
  colorClass?: string;
}> = ({ label, subLabel, value, unit = "", colorClass = "" }) => (
  <div className="text-center min-w-[80px]">
    <div className="text-xs text-gray-400">{label}</div>
    {subLabel && <div className="text-xs text-gray-400">({subLabel})</div>}
    <div className={`text-base font-semibold ${colorClass}`}>
      {value !== null ? `${value}${unit}` : "-"}
    </div>
  </div>
);

// 根据在线率返回颜色
const getUptimeColor = (uptimePercentage: number | null | undefined) => {
  if (uptimePercentage === undefined || uptimePercentage === null)
    return "text-gray-400";
  if (uptimePercentage >= 99) return "text-green-500";
  if (uptimePercentage >= 95) return "text-yellow-500";
  return "text-red-500";
};

export const EndpointItem: React.FC<EndpointItemProps> = ({
  endpoint,
  onEdit,
  onSwitchEnabled,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(true);
  const { data: statsData } = useGetEndpointMultiRangeStats(endpoint.id);
  const stats = statsData?.data;

  const hasData =
    stats &&
    (stats.current.responseTime !== null || stats.stats24h.totalChecks > 0);

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
              <Button>复制</Button>
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
                label="响应"
                subLabel="当前"
                value={stats.current.responseTime}
                unit=" ms"
                colorClass={
                  stats.current.success === false
                    ? "text-red-500"
                    : "text-blue-500"
                }
              />
              <StatCard
                label="平均响应"
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
