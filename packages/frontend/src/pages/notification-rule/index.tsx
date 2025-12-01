import React from "react";
import {
  useGetRuleList,
  useDeleteRule,
  NotificationRule,
} from "@/services/notification";
import { Button, Flex, Modal, Table, Tag, Space } from "antd";
import { useSearchParams } from "react-router-dom";
import { DetailPageType } from "@/utils/use-detail-type";
import { DetailModal } from "./detail";
import { ColumnType } from "antd/es/table";
import { utcdayjsFormat } from "@/utils/dayjs";
import {
  RedoOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
  CloudServerOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import { usePageTitle } from "@/store/global";

const scopeTypeLabels = {
  ALL: { label: "全局", icon: <GlobalOutlined />, color: "purple" },
  HOST: { label: "服务", icon: <CloudServerOutlined />, color: "blue" },
  ENDPOINT: { label: "端点", icon: <ApiOutlined />, color: "cyan" },
};

const NotificationRulePage: React.FC = () => {
  usePageTitle("通知规则");

  const {
    data: listData,
    refetch: reloadList,
    isFetching: loadingList,
  } = useGetRuleList();

  const { mutateAsync: deleteRule } = useDeleteRule();

  const tableDataSource = (listData?.data as NotificationRule[]) ?? [];

  const [searchParams, setSearchParams] = useSearchParams();

  const onAdd = () => {
    searchParams.set("modal", DetailPageType.Add);
    setSearchParams(searchParams, { replace: true });
  };

  const onEdit = (id: string) => {
    searchParams.set("modal", DetailPageType.Edit);
    searchParams.set("id", id);
    setSearchParams(searchParams, { replace: true });
  };

  const onDeleteConfirm = async (item: NotificationRule) => {
    Modal.confirm({
      title: `确认删除规则"${item.name}"？`,
      onOk: async () => {
        await deleteRule(item.id);
      },
    });
  };

  const columns: ColumnType<NotificationRule>[] = [
    {
      title: "规则名称",
      dataIndex: "name",
      width: 180,
    },
    {
      title: "作用范围",
      dataIndex: "scopeType",
      width: 200,
      render: (scopeType: string, record: NotificationRule) => {
        const config =
          scopeTypeLabels[scopeType as keyof typeof scopeTypeLabels];
        let scopeName = config?.label || scopeType;

        if (scopeType === "HOST" && record.host) {
          scopeName = `服务: ${record.host.name}`;
        } else if (scopeType === "ENDPOINT" && record.endpoint) {
          scopeName = `端点: ${record.endpoint.name}`;
        }

        return (
          <Tag color={config?.color} icon={config?.icon}>
            {scopeName}
          </Tag>
        );
      },
    },
    {
      title: "通知渠道",
      dataIndex: ["channel", "name"],
      width: 150,
    },
    {
      title: "触发条件",
      width: 180,
      render: (_, record: NotificationRule) => (
        <Space direction="vertical" size={0}>
          <span>连续失败 {record.consecutiveFailures} 次</span>
          <span className="text-gray-400 text-xs">
            冷却 {record.cooldownMinutes} 分钟
          </span>
        </Space>
      ),
    },
    {
      title: "恢复通知",
      dataIndex: "notifyOnRecovery",
      width: 100,
      align: "center",
      render: (value: boolean) => (
        <Tag color={value ? "success" : "default"}>{value ? "是" : "否"}</Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 80,
      align: "center",
      render: (enabled: boolean) => (
        <Tag
          color={enabled ? "success" : "default"}
          icon={enabled ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {enabled ? "启用" : "禁用"}
        </Tag>
      ),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      width: 160,
      render: (text: string) => utcdayjsFormat(text),
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Flex justify="center">
          <Button type="link" size="small" onClick={() => onEdit(record.id)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => onDeleteConfirm(record)}
          >
            删除
          </Button>
        </Flex>
      ),
    },
  ];

  return (
    <Flex vertical gap={16} className="p-4">
      <Flex justify="flex-end" align="center">
        <Flex gap={8}>
          <Button type="primary" onClick={onAdd}>
            新增规则
          </Button>
          <Button onClick={() => reloadList()} icon={<RedoOutlined />}></Button>
        </Flex>
      </Flex>
      <Table
        bordered
        size="small"
        columns={columns}
        dataSource={tableDataSource}
        loading={loadingList}
        rowKey="id"
        pagination={false}
      />

      <DetailModal />
    </Flex>
  );
};

export default NotificationRulePage;
