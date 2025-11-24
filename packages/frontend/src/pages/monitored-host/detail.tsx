import { useDetailType } from "@/utils/use-detail-type";
import { FC, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Form, Input, Modal, Skeleton, Switch } from "antd";
import {
  useCreateMonitoredHost,
  useGetMonitoredHostDetail,
  useUpdateMonitoredHost,
} from "@/services/monitored-host";

export const DetailModal: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const detailType = searchParams.get("modal");
  const detailId = searchParams.get("id");

  const isOpen = !!detailType;
  const { isAdd, isEdit, isReadonly } = useDetailType(detailType);

  const { mutateAsync: runAddHost, isPending: adding } =
    useCreateMonitoredHost();
  const { mutateAsync: runEditHost, isPending: updating } =
    useUpdateMonitoredHost();
  const { data: hostDetailResp, isLoading } =
    useGetMonitoredHostDetail(detailId);

  const hostDetail = hostDetailResp?.data;

  useEffect(() => {
    const convert = async () => {
      if (!hostDetail) return;

      const formValues = {
        ...hostDetail,
        headers: hostDetail.headers
          ? JSON.stringify(hostDetail.headers, null, 2)
          : "",
      };

      form.setFieldsValue(formValues);
    };

    convert();
  }, [hostDetail]);

  const [form] = Form.useForm();

  const onCancel = () => {
    searchParams.delete("modal");
    searchParams.delete("id");
    setSearchParams(searchParams, { replace: true });
  };

  const onSave = async () => {
    await form.validateFields();
    const values = form.getFieldsValue();

    // Parse headers if provided
    if (values.headers) {
      try {
        values.headers = JSON.parse(values.headers);
      } catch {
        Modal.error({
          title: "格式错误",
          content: "请求头必须是有效的JSON格式",
        });
        return false;
      }
    } else {
      values.headers = null;
    }

    if (isAdd) {
      const resp = await runAddHost(values);
      if (resp?.code !== 200) return false;
    } else if (isEdit) {
      const resp = await runEditHost({ id: detailId, ...values });
      if (resp?.code !== 200) return false;
    }

    onCancel();
    return true;
  };

  return (
    <>
      <Modal
        title={isAdd ? "新增监控服务" : "编辑监控服务"}
        open={isOpen}
        onOk={onSave}
        width={600}
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
            enabled: true,
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
              label="服务名称"
              name="name"
              rules={[{ required: true, message: "请输入服务名称" }]}
            >
              <Input placeholder="请输入服务名称" />
            </Form.Item>

            <Form.Item
              label="基础URL"
              name="url"
              tooltip="服务的基础URL，端点可以继承此URL"
            >
              <Input placeholder="例如: https://api.example.com" />
            </Form.Item>

            <Form.Item
              label="请求头 (JSON)"
              name="headers"
              tooltip="自定义请求头，使用JSON格式"
            >
              <Input.TextArea
                rows={4}
                placeholder='例如: {"Authorization": "Bearer token"}'
              />
            </Form.Item>

            <Form.Item
              label="Cron表达式"
              name="cronExpression"
              tooltip="定时执行的Cron表达式，端点可以继承此配置"
            >
              <Input placeholder="例如: */5 * * * * (每5分钟)" />
            </Form.Item>

            <Form.Item label="启用状态" name="enabled" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          </Skeleton>
        </Form>
      </Modal>
    </>
  );
};
