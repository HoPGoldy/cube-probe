import { useDetailType } from "@/utils/use-detail-type";
import { FC, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Skeleton,
  Switch,
} from "antd";
import {
  useCreateEndpoint,
  useGetEndpointDetail,
  useUpdateEndpoint,
} from "@/services/monitored-endpoint";
import { useGetMonitoredHostList } from "@/services/monitored-host";

export const DetailModal: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const detailType = searchParams.get("modal");
  const detailId = searchParams.get("id");

  const isOpen = !!detailType;
  const { isAdd, isEdit, isReadonly } = useDetailType(detailType);

  const { mutateAsync: runAddEndpoint, isPending: adding } =
    useCreateEndpoint();
  const { mutateAsync: runEditEndpoint, isPending: updating } =
    useUpdateEndpoint();
  const { data: endpointDetailResp, isLoading } =
    useGetEndpointDetail(detailId);
  const { data: servicesResp } = useGetMonitoredHostList({});

  const endpointDetail = endpointDetailResp?.data;
  const services = servicesResp?.data ?? [];

  useEffect(() => {
    const convert = async () => {
      if (!endpointDetail) return;

      const formValues = {
        ...endpointDetail,
        headers: endpointDetail.headers
          ? JSON.stringify(endpointDetail.headers, null, 2)
          : "",
      };

      form.setFieldsValue(formValues);
    };

    convert();
  }, [endpointDetail]);

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
      const resp = await runAddEndpoint(values);
      if (resp?.code !== 200) return false;
    } else if (isEdit) {
      const resp = await runEditEndpoint({ id: detailId, ...values });
      if (resp?.code !== 200) return false;
    }

    onCancel();
    return true;
  };

  return (
    <>
      <Modal
        title={isAdd ? "新增监控端点" : "编辑监控端点"}
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
            timeout: 10000,
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
              label="所属服务"
              name="serviceId"
              rules={[{ required: true, message: "请选择所属服务" }]}
            >
              <Select
                placeholder="请选择所属服务"
                options={services.map((s: any) => ({
                  label: s.name,
                  value: s.id,
                }))}
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item
              label="端点名称"
              name="name"
              rules={[{ required: true, message: "请输入端点名称" }]}
            >
              <Input placeholder="请输入端点名称" />
            </Form.Item>

            <Form.Item
              label="URL"
              name="url"
              tooltip="端点的URL，如果为空则继承服务的URL"
            >
              <Input placeholder="例如: /api/health" />
            </Form.Item>

            <Form.Item
              label="请求头 (JSON)"
              name="headers"
              tooltip="自定义请求头，使用JSON格式，为空则继承服务的请求头"
            >
              <Input.TextArea
                rows={4}
                placeholder='例如: {"Authorization": "Bearer token"}'
              />
            </Form.Item>

            <Form.Item
              label="探测间隔 (秒)"
              name="intervalTime"
              tooltip="定时探测的间隔时间（秒），为空则继承服务的间隔时间"
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                placeholder="例如: 60 (每60秒执行一次)"
              />
            </Form.Item>

            <Form.Item
              label="超时时间 (毫秒)"
              name="timeout"
              tooltip="请求超时时间，默认10000毫秒"
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                max={300000}
                placeholder="10000"
              />
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
