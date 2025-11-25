import React, { useState } from "react";
import {
  useDeleteEndpoint,
  useGetEndpointList,
  useUpdateEndpoint,
} from "@/services/monitored-endpoint";
import { useGetMonitoredHostList } from "@/services/monitored-host";
import { Button, Flex, Modal, Table, Tag } from "antd";
import { useSearchParams } from "react-router-dom";
import { DetailPageType } from "@/utils/use-detail-type";
import { DetailModal } from "./detail";
import { ColumnType } from "antd/es/table";
import { utcdayjsFormat } from "@/utils/dayjs";
import { RedoOutlined } from "@ant-design/icons";
import { TableSearch } from "@/components/table-search";
import { DEFAULT_PAGE_SIZE } from "@/config";
import { usePageTitle } from "@/store/global";

const MonitoredEndpointPage: React.FC = () => {
  usePageTitle("监控端点管理");
  const [searchParams, setSearchParams] = useSearchParams();
  const hostId = searchParams.get("hostId");

  const [searchValues, setSearchValues] = useState({});
  const [paginationValues, setPaginationValues] = useState({
    page: 1,
    size: DEFAULT_PAGE_SIZE,
  });

  const {
    data: listData,
    refetch: reloadList,
    isFetching: loadingList,
  } = useGetEndpointList({
    ...searchValues,
    ...paginationValues,
    ...(hostId ? { serviceId: hostId } : {}),
  });

  const { data: servicesData } = useGetMonitoredHostList({});

  const { mutateAsync: updateEndpoint } = useUpdateEndpoint();
  const { mutateAsync: deleteEndpoint } = useDeleteEndpoint();

  const tableDataSource = listData?.data ?? [];
  const tableTotal = tableDataSource.length;

  const services = servicesData?.data ?? [];
  const serviceMap = new Map(services.map((s: any) => [s.id, s.name]));

  const onAdd = () => {
    searchParams.set("modal", DetailPageType.Add);
    setSearchParams(searchParams, { replace: true });
  };

  const onEdit = (id: string) => {
    searchParams.set("modal", DetailPageType.Edit);
    searchParams.set("id", id);
    setSearchParams(searchParams, { replace: true });
  };

  const onSwitchEnabled = async (item: any) => {
    await updateEndpoint({
      id: item.id,
      enabled: !item.enabled,
    });
  };

  const onDeleteConfirm = async (item: any) => {
    Modal.confirm({
      title: `确认删除端点"${item.name}"？`,
      content: "删除后该端点的所有探测记录也将被删除",
      onOk: async () => {
        await deleteEndpoint(item.id);
      },
    });
  };

  const columns: ColumnType<any>[] = [
    {
      title: "端点名称",
      dataIndex: "name",
      align: "center",
      width: 200,
    },
    {
      title: "所属服务",
      dataIndex: "serviceId",
      align: "center",
      width: 150,
      render: (serviceId) => serviceMap.get(serviceId) || "-",
    },
    {
      title: "URL",
      dataIndex: "url",
      align: "center",
      render: (text) => text || "-",
    },
    {
      title: "超时(ms)",
      dataIndex: "timeout",
      align: "center",
      width: 100,
      render: (text) => text || "-",
    },
    {
      title: "Cron表达式",
      dataIndex: "cronExpression",
      align: "center",
      width: 130,
      render: (text) => text || "-",
    },
    {
      title: "状态",
      dataIndex: "enabled",
      align: "center",
      width: 100,
      render: (text) => {
        return text ? (
          <Tag color="green">已启用</Tag>
        ) : (
          <Tag color="red">已禁用</Tag>
        );
      },
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      align: "center",
      width: 180,
      render: (text) => {
        return utcdayjsFormat(text);
      },
    },
    {
      title: "操作",
      key: "action",
      align: "center",
      width: 200,
      render: (_, record) => (
        <Flex justify="center">
          <Button type="link" size="small" onClick={() => onEdit(record.id)}>
            编辑
          </Button>
          <Button
            key={record.enabled ? "disable" : "enable"}
            type="link"
            size="small"
            danger={record.enabled}
            onClick={() => onSwitchEnabled(record)}
          >
            {record.enabled ? "禁用" : "启用"}
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
      <Flex justify="space-between" align="center">
        <TableSearch onChange={setSearchValues} />
        <Flex gap={8}>
          <Button type="primary" onClick={onAdd}>
            新增
          </Button>
          <Button onClick={() => reloadList()} icon={<RedoOutlined />}></Button>
        </Flex>
      </Flex>
      <Table
        bordered
        size="small"
        rowKey="id"
        columns={columns}
        dataSource={tableDataSource}
        loading={loadingList}
        pagination={{
          total: tableTotal,
          current: paginationValues.page,
          pageSize: paginationValues.size,
          onChange: (page, size) => setPaginationValues({ page, size }),
        }}
      />

      <DetailModal />
    </Flex>
  );
};

export default MonitoredEndpointPage;
