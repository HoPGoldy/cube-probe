import { useDetailType } from "@/utils/use-detail-type";
import { FC, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Flex, Form, Input, Modal, Select, Skeleton } from "antd";
import {
  useCreateUser,
  useGetUserDetail,
  UserRole,
  useUpdateUser,
} from "@/services/user";
import { nanoid } from "nanoid";
import { shaWithSalt } from "@/utils/crypto";

export const DetailModal: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const detailType = searchParams.get("modal");
  const detailId = searchParams.get("id");

  const isOpen = !!detailType;
  const { isAdd, isEdit, isReadonly } = useDetailType(detailType);

  const { mutateAsync: runAddUser, isPending: adding } = useCreateUser();
  const { mutateAsync: runEditUser, isPending: updating } = useUpdateUser();
  const { data: userDetailResp, isLoading } = useGetUserDetail(detailId);

  const userDetail = userDetailResp?.data;

  useEffect(() => {
    const convert = async () => {
      if (!userDetail) return;

      const formValues = {
        ...userDetail,
      };

      form.setFieldsValue(formValues);
    };

    convert();
  }, [userDetail]);

  const [form] = Form.useForm();

  const onCancel = () => {
    searchParams.delete("modal");
    searchParams.delete("id");
    setSearchParams(searchParams, { replace: true });
  };

  const onSave = async () => {
    await form.validateFields();
    const values = form.getFieldsValue();

    if (isAdd) {
      values.passwordHash = shaWithSalt(values.password, values.username);
      delete values.password;
      const resp = await runAddUser(values);
      if (resp?.code !== 200) return false;
    } else if (isEdit) {
      delete values.password;
      const resp = await runEditUser({ id: detailId, ...values });
      if (resp?.code !== 200) return false;
    }

    onCancel();
    return true;
  };

  const onRegeneratePassword = () => {
    form.setFieldsValue({
      password: nanoid(),
    });
  };

  return (
    <>
      <Modal
        title={isAdd ? "新增用户" : "编辑用户"}
        open={isOpen}
        onOk={onSave}
        width={500}
        loading={isLoading || adding || updating}
        onCancel={onCancel}
        afterClose={() => {
          form.resetFields();
        }}
      >
        <Form
          form={form}
          layout="vertical"
          disabled={isReadonly}
          initialValues={{
            password: nanoid(),
            role: UserRole.USER,
          }}
          style={{
            marginTop: 16,
            maxHeight: "60vh",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <Skeleton active loading={isLoading}>
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: "请输入用户名" }]}
            >
              <Input type="text" placeholder="请输入用户名" disabled={isEdit} />
            </Form.Item>
            <Form.Item
              label={
                <Flex align="center" gap={4}>
                  <span>密码</span>
                  {isAdd && (
                    <Button
                      type="link"
                      size="small"
                      onClick={onRegeneratePassword}
                    >
                      重新生成
                    </Button>
                  )}
                </Flex>
              }
              name="password"
              rules={[{ required: isAdd, message: "请输入密码" }]}
            >
              <Input.Password
                visibilityToggle={isAdd}
                placeholder={isAdd ? "请输入密码" : "留空则不修改密码"}
                disabled={isEdit}
              />
            </Form.Item>
            <Form.Item label="角色" name="role">
              <Select
                options={[
                  { label: "管理员", value: UserRole.ADMIN },
                  { label: "普通用户", value: UserRole.USER },
                ]}
                placeholder="请选择角色"
              />
            </Form.Item>
          </Skeleton>
        </Form>
      </Modal>
    </>
  );
};
