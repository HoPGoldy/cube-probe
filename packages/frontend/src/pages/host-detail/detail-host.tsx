import { useDetailType } from "@/utils/use-detail-type";
import { FC, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Form,
  Input,
  InputNumber,
  Modal,
  Skeleton,
  Switch,
  Select,
  Divider,
} from "antd";
import {
  useCreateMonitoredHost,
  useGetMonitoredHostDetail,
  useUpdateMonitoredHost,
} from "@/services/monitored-host";
import { useGetChannelList } from "@/services/notification";

export const DETAIL_TYPE_KEY = "host-modal";

export const DETAIL_ID_KEY = "host-id";

export const HostDetailModal: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const detailType = searchParams.get(DETAIL_TYPE_KEY);
  const detailId = searchParams.get(DETAIL_ID_KEY);

  const isOpen = !!detailType;
  const { isAdd, isEdit, isReadonly } = useDetailType(detailType);

  const { mutateAsync: runAddHost, isPending: adding } =
    useCreateMonitoredHost();
  const { mutateAsync: runEditHost, isPending: updating } =
    useUpdateMonitoredHost();
  const { data: hostDetailResp, isLoading } =
    useGetMonitoredHostDetail(detailId);
  const { data: channelsResp } = useGetChannelList();

  const hostDetail = hostDetailResp?.data;
  const channels = channelsResp?.data ?? [];

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
    searchParams.delete(DETAIL_TYPE_KEY);
    searchParams.delete(DETAIL_ID_KEY);
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

    if (!values.url) {
      delete values.url;
    }

    if (!values.intervalTime) {
      delete values.intervalTime;
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
        destroyOnClose
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
            notifyEnabled: false,
            notifyFailureCount: 3,
            notifyCooldownMin: 30,
            notifyChannelIds: [],
          }}
          style={{
            marginTop: 16,
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

            <Form.Item label="启用状态" name="enabled" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>

            <Divider>通知配置</Divider>

            <Form.Item
              label="启用通知"
              name="notifyEnabled"
              valuePropName="checked"
              tooltip="开启后，当服务下的端点连续失败达到阈值时发送通知"
            >
              <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>

            <Form.Item
              label="失败阈值"
              name="notifyFailureCount"
              tooltip="端点连续失败多少次后触发通知"
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                max={100}
                placeholder="默认: 3"
              />
            </Form.Item>

            <Form.Item
              label="冷却时间 (分钟)"
              name="notifyCooldownMin"
              tooltip="发送通知后的冷却时间，避免频繁通知"
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                max={1440}
                placeholder="默认: 30"
              />
            </Form.Item>

            <Form.Item
              label="通知渠道"
              name="notifyChannelIds"
              tooltip="选择要发送通知的渠道"
            >
              <Select
                mode="multiple"
                placeholder="请选择通知渠道"
                options={channels.map((c: any) => ({
                  label: c.name,
                  value: c.id,
                }))}
              />
            </Form.Item>
          </Skeleton>
        </Form>
      </Modal>
    </>
  );
};
