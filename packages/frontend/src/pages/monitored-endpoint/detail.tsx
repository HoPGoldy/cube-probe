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
        // bodyContent 已经是字符串，直接使用
        bodyContent: endpointDetail.bodyContent || "",
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

    // bodyContent 直接作为字符串保存，不需要解析
    // 只在用户选择了 json 或 x-www-form-urlencoded 时验证 JSON 格式
    if (values.bodyContent) {
      const contentType = values.bodyContentType || "json";
      if (contentType === "json" || contentType === "x-www-form-urlencoded") {
        try {
          JSON.parse(values.bodyContent); // 验证格式但不保存解析结果
        } catch {
          Modal.error({
            title: "格式错误",
            content: `请求体内容必须是有效的JSON格式（当前编码类型: ${contentType}）`,
          });
          return false;
        }
      }
    } else {
      values.bodyContent = null;
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
            method: "GET",
            timeout: 10000,
            bodyContentType: "json",
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

            <Form.Item label="请求方法" name="method" tooltip="HTTP请求方法">
              <Select
                placeholder="请选择请求方法"
                options={[
                  { label: "GET", value: "GET" },
                  { label: "POST", value: "POST" },
                  { label: "PUT", value: "PUT" },
                  { label: "DELETE", value: "DELETE" },
                  { label: "PATCH", value: "PATCH" },
                  { label: "HEAD", value: "HEAD" },
                  { label: "OPTIONS", value: "OPTIONS" },
                ]}
              />
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

            <Form.Item
              label="请求体编码"
              name="bodyContentType"
              tooltip="请求体的编码类型"
            >
              <Select
                placeholder="请选择请求体编码类型"
                options={[
                  { label: "JSON", value: "json" },
                  {
                    label: "x-www-form-urlencoded",
                    value: "x-www-form-urlencoded",
                  },
                  { label: "XML", value: "xml" },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="请求体内容"
              name="bodyContent"
              tooltip="请求体的内容。JSON/Form编码时输入JSON格式，XML编码时直接输入XML字符串"
            >
              <Input.TextArea
                rows={4}
                placeholder='JSON/Form: {"key": "value"}&#10;XML: <root>...</root>'
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
