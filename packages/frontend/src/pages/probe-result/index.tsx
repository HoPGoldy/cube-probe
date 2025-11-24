import React, { useState } from "react";
import {
  useDeleteProbeResult,
  useGetProbeResultList,
} from "@/services/probe-result";
import { useGetEndpointList } from "@/services/monitored-endpoint";
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

interface EndpointData {
  id: string;
  name: string;
  serviceId: string;
}

const ProbeResultPage: React.FC = () => {
  usePageTitle("探测结果管理");
  const [searchValues, setSearchValues] = useState({});
  const [paginationValues, setPaginationValues] = useState({
    page: 1,
    size: DEFAULT_PAGE_SIZE,
  });

  const {
    data: listData,
    refetch: reloadList,
    isFetching: loadingList,
  } = useGetProbeResultList({ ...searchValues, ...paginationValues });

  const { data: endpointsData } = useGetEndpointList({});
  const { data: servicesData } = useGetMonitoredHostList({});

  const { mutateAsync: deleteResult } = useDeleteProbeResult();

  const tableDataSource = listData?.data ?? [];
  const tableTotal = tableDataSource.length;

  const endpoints = endpointsData?.data ?? [];
  const endpointMap = new Map<string, EndpointData>(
    endpoints.map((e: any) => [
      e.id,
      { id: e.id, name: e.name, serviceId: e.serviceId },
    ]),
  );

  const services = servicesData?.data ?? [];
  const serviceMap = new Map(services.map((s: any) => [s.id, s.name]));

  const [searchParams, setSearchParams] = useSearchParams();

  const onAdd = () => {
    searchParams.set("modal", DetailPageType.Add);
    setSearchParams(searchParams, { replace: true });
  };

  const onView = (id: string) => {
    searchParams.set("modal", DetailPageType.Readonly);
    searchParams.set("id", id);
    setSearchParams(searchParams, { replace: true });
  };

  const onDeleteConfirm = async (item: any) => {
    const endpoint = endpointMap.get(item.endPointId);
    Modal.confirm({
      title: `确认删除探测记录？`,
      content: `端点: ${endpoint ? endpoint.name : item.endPointId}`,
      onOk: async () => {
        await deleteResult(item.id);
      },
    });
  };

  const columns: ColumnType<any>[] = [
    {
      title: "端点名称",
      dataIndex: "endPointId",
      align: "center",
      width: 200,
      render: (endPointId: string) => {
        const endpoint = endpointMap.get(endPointId);
        return endpoint ? endpoint.name : "-";
      },
    },
    {
      title: "所属服务",
      dataIndex: "endPointId",
      align: "center",
      width: 150,
      render: (endPointId: string) => {
        const endpoint = endpointMap.get(endPointId);
        return endpoint ? serviceMap.get(endpoint.serviceId) || "-" : "-";
      },
    },
    {
      title: "状态码",
      dataIndex: "status",
      align: "center",
      width: 100,
      render: (status) => {
        if (!status) return "-";
        const color =
          status >= 200 && status < 300
            ? "green"
            : status >= 400
              ? "red"
              : "orange";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "响应时间(ms)",
      dataIndex: "responseTime",
      align: "center",
      width: 120,
      render: (time) => (time ? `${time}ms` : "-"),
    },
    {
      title: "执行结果",
      dataIndex: "success",
      align: "center",
      width: 100,
      render: (success) => {
        return success ? (
          <Tag color="green">成功</Tag>
        ) : (
          <Tag color="red">失败</Tag>
        );
      },
    },
    {
      title: "消息",
      dataIndex: "message",
      align: "center",
      ellipsis: true,
      render: (text) => text || "-",
    },
    {
      title: "执行时间",
      dataIndex: "timestamp",
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
      width: 150,
      render: (_, record) => (
        <Flex justify="center">
          <Button type="link" size="small" onClick={() => onView(record.id)}>
            查看
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

export default ProbeResultPage;
