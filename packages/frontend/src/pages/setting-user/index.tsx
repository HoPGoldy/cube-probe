import React, { useState } from "react";
import {
  useDeleteUser,
  useGetUserList,
  UserRole,
  useUpdateUser,
} from "@/services/user";
import { Button, Flex, Modal, Space, Table, Tag } from "antd";
import { useSearchParams } from "react-router-dom";
import { DetailPageType } from "@/utils/use-detail-type";
import { DetailModal } from "./detail";
import { ColumnType } from "antd/es/table";
import { utcdayjsFormat } from "@/utils/dayjs";
import { nanoid } from "nanoid";
import { shaWithSalt } from "@/utils/crypto";
import copy from "copy-to-clipboard";
import { messageSuccess } from "@/utils/message";
import { RedoOutlined } from "@ant-design/icons";
import { TableSearch } from "@/components/table-search";
import { DEFAULT_PAGE_SIZE } from "@/config";
import { usePageTitle } from "@/store/global";

const SettingUserPage: React.FC = () => {
  usePageTitle("用户管理");
  const [searchValues, setSearchValues] = useState({});
  const [paginationValues, setPaginationValues] = useState({
    page: 1,
    size: DEFAULT_PAGE_SIZE,
  });

  const {
    data: listData,
    refetch: reloadList,
    isFetching: loadingList,
  } = useGetUserList({ ...searchValues, ...paginationValues });

  const { mutateAsync: updateUser } = useUpdateUser();
  const { mutateAsync: deleteUser } = useDeleteUser();

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

  const onSwitchBan = async (item) => {
    await updateUser({
      id: item.id,
      isBanned: !item.isBanned,
    });
  };

  const onResetPasswordConfirm = async (item) => {
    Modal.confirm({
      title: "确认重置密码？",
      onOk: async () => {
        await onResetPassword(item);
      },
    });
  };

  const onResetPassword = async (item) => {
    const newPassword = nanoid(); // 生成一个新的随机密码

    const resp = await updateUser({
      id: item.id,
      passwordHash: shaWithSalt(newPassword, item.username),
    });
    if (resp?.code !== 200) return false;

    Modal.success({
      title: "密码已重置",
      content: `新密码：${newPassword}`,
      footer(originNode) {
        return (
          <Space>
            <Button
              onClick={() => {
                copy(newPassword);
                messageSuccess("已复制至剪切板");
              }}
            >
              复制密码
            </Button>
            {originNode}
          </Space>
        );
      },
    });
  };

  const onDeleteConfirm = async (item) => {
    Modal.confirm({
      title: `确认删除用户“${item.username}”？`,
      onOk: async () => {
        await deleteUser(item.id);
      },
    });
  };

  const columns: ColumnType[] = [
    {
      title: "用户名",
      dataIndex: "username",
      align: "center",
    },
    {
      title: "角色",
      dataIndex: "role",
      align: "center",
      width: 200,
      render: (text) => {
        return text === UserRole.ADMIN ? "管理员" : "普通用户";
      },
    },
    {
      title: "禁用状态",
      dataIndex: "isBanned",
      align: "center",
      width: 100,
      render: (text) => {
        return text ? (
          <Tag color="red">已禁用</Tag>
        ) : (
          <Tag color="green">正常使用</Tag>
        );
      },
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
      width: 180,
      render: (_, record) => (
        <Flex justify="center">
          <Button type="link" size="small" onClick={() => onEdit(record.id)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => onResetPasswordConfirm(record)}
          >
            重置密码
          </Button>
          <Button
            key={record.isBanned ? "enable" : "disable"}
            type="link"
            size="small"
            danger={!record.isBanned}
            onClick={() => onSwitchBan(record)}
          >
            {record.isBanned ? "启用" : "禁用"}
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

export default SettingUserPage;
