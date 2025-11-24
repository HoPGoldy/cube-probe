import React, { useState } from "react";
import {
  ApplicationListQueryDto,
  useDeleteApplication,
  useGetApplicationList,
} from "@/services/application";
import { Button, Flex, Modal, Table } from "antd";
import { useSearchParams } from "react-router-dom";
import { DetailPageType } from "@/utils/use-detail-type";
import { DetailModal } from "./detail";
import { ColumnType } from "antd/es/table";
import { utcdayjsFormat } from "@/utils/dayjs";
import { RedoOutlined } from "@ant-design/icons";
import { TableSearch } from "@/components/table-search";
import { DEFAULT_PAGE_SIZE } from "@/config";
import copy from "copy-to-clipboard";
import { withFrontend } from "@/utils/path";
import { messageSuccess } from "@/utils/message";
import { usePageTitle } from "@/store/global";

const SettingApplicationPage: React.FC = () => {
  usePageTitle("应用管理");

  const [searchValues, setSearchValues] = useState({});
  const [paginationValues, setPaginationValues] = useState({
    page: 1,
    size: DEFAULT_PAGE_SIZE,
  });

  const {
    data: listData,
    refetch: reloadList,
    isFetching: loadingList,
  } = useGetApplicationList({
    ...searchValues,
    ...paginationValues,
  } as ApplicationListQueryDto);

  const { mutateAsync: deleteApplication } = useDeleteApplication();

  const tableDataSource = listData?.data?.items ?? [];
  const tableTotal = listData?.data?.total ?? 0;

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

  const onDeleteConfirm = async (item) => {
    Modal.confirm({
      title: `确认删除应用“${item.name}”？`,
      onOk: async () => {
        await deleteApplication(item.id);
      },
    });
  };

  const onCopyLoginLink = (item) => {
    copy(withFrontend(`/login/${item.id}`));
    messageSuccess("登录链接已复制到剪贴板");
  };

  const columns: ColumnType[] = [
    {
      title: "ID",
      dataIndex: "id",
      align: "center",
      width: 380,
    },
    {
      title: "应用名称",
      dataIndex: "name",
      align: "center",
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      align: "center",
      width: 200,
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
          <Button
            type="link"
            size="small"
            onClick={() => onCopyLoginLink(record)}
          >
            复制登录链接
          </Button>
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
        columns={columns}
        dataSource={tableDataSource}
        loading={loadingList}
        rowKey="id"
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

export default SettingApplicationPage;
