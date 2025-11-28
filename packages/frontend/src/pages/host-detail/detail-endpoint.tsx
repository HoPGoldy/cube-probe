import { useDetailType } from "@/utils/use-detail-type";
import { FC, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Skeleton,
  Switch,
  Radio,
} from "antd";
import {
  useCreateEndpoint,
  useGetEndpointDetail,
  useUpdateEndpoint,
} from "@/services/monitored-endpoint";

export const DETAIL_TYPE_KEY = "ep-modal";

export const DETAIL_ID_KEY = "ep-id";

export const EndpointDetailModal: FC = () => {
  const { hostId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const detailType = searchParams.get(DETAIL_TYPE_KEY);
  const detailId = searchParams.get(DETAIL_ID_KEY);

  const isOpen = !!detailType;
  const { isAdd, isEdit, isReadonly } = useDetailType(detailType);

  const { mutateAsync: runAddEndpoint, isPending: adding } =
    useCreateEndpoint();
  const { mutateAsync: runEditEndpoint, isPending: updating } =
    useUpdateEndpoint();
  const { data: endpointDetailResp, isLoading } =
    useGetEndpointDetail(detailId);

  const endpointDetail = endpointDetailResp?.data;

  const [form] = Form.useForm();

  useEffect(() => {
    if (!endpointDetail) return;

    const formValues = {
      ...endpointDetail,
      headers: endpointDetail.headers
        ? JSON.stringify(endpointDetail.headers, null, 2)
        : "",
      bodyContent: endpointDetail.bodyContent || "",
      codeContent: endpointDetail.codeContent || "",
    };

    form.setFieldsValue(formValues);
    console.log("formValues", formValues);
  }, [endpointDetail, form]);

  const onCancel = () => {
    searchParams.delete(DETAIL_TYPE_KEY);
    searchParams.delete(DETAIL_ID_KEY);
    setSearchParams(searchParams, { replace: true });
  };

  const onSave = async () => {
    await form.validateFields();
    const values = form.getFieldsValue();

    values.serviceId = hostId;

    const currentType = values.type || "CONFIG";

    // CONFIG 模式：解析 headers
    if (currentType === "CONFIG") {
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

      // bodyContent 验证
      if (values.bodyContent) {
        const contentType = values.bodyContentType || "json";
        if (contentType === "json" || contentType === "x-www-form-urlencoded") {
          try {
            JSON.parse(values.bodyContent);
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

      // 清空 CODE 模式字段
      delete values.codeContent;
    } else {
      // CODE 模式：清空 CONFIG 模式字段
      delete values.url;
      delete values.method;
      delete values.headers;
      delete values.timeout;
      delete values.bodyContentType;
      delete values.bodyContent;
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
            serviceId: hostId,
            enabled: true,
            type: "CONFIG",
            method: "GET",
            timeout: 10,
            bodyContentType: "json",
          }}
          style={{
            marginTop: 16,
            // maxHeight: "60vh",
            // overflowY: "auto",
            // overflowX: "hidden",
          }}
        >
          <Skeleton active loading={isLoading}>
            <Form.Item
              label="端点名称"
              name="name"
              rules={[{ required: true, message: "请输入端点名称" }]}
            >
              <Input placeholder="请输入端点名称" />
            </Form.Item>

            <Form.Item
              label="端点类型"
              name="type"
              tooltip="CONFIG: 通过配置URL等参数进行探测；CODE: 通过代码逻辑进行探测"
            >
              <Radio.Group>
                <Radio.Button value="CONFIG">配置模式</Radio.Button>
                <Radio.Button value="CODE">编码模式</Radio.Button>
              </Radio.Group>
            </Form.Item>

            {/* CONFIG 模式字段 */}
            <Form.Item
              noStyle
              shouldUpdate={(prev, cur) => prev.type !== cur.type}
            >
              {({ getFieldValue }) =>
                getFieldValue("type") !== "CODE" && (
                  <>
                    <Form.Item
                      label="URL"
                      name="url"
                      tooltip="端点的URL，如果为空则继承服务的URL"
                    >
                      <Input placeholder="例如: /api/health" />
                    </Form.Item>

                    <Form.Item
                      label="请求方法"
                      name="method"
                      tooltip="HTTP请求方法"
                    >
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

                    <Form.Item
                      label="超时时间 (秒)"
                      name="timeout"
                      tooltip="请求超时时间，默认10秒"
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={1}
                        max={300}
                        placeholder="10"
                      />
                    </Form.Item>
                  </>
                )
              }
            </Form.Item>

            {/* CODE 模式字段 */}
            <Form.Item
              noStyle
              shouldUpdate={(prev, cur) => prev.type !== cur.type}
            >
              {({ getFieldValue }) =>
                getFieldValue("type") === "CODE" && (
                  <Form.Item
                    label="代码内容"
                    name="codeContent"
                    tooltip="编写探测逻辑代码"
                    rules={[{ required: true, message: "请输入代码内容" }]}
                  >
                    <Input.TextArea
                      rows={12}
                      placeholder="// 编写探测代码&#10;// 返回 { success: boolean, message?: string, responseTime?: number }"
                      style={{ fontFamily: "monospace" }}
                    />
                  </Form.Item>
                )
              }
            </Form.Item>

            {/* 通用字段 */}
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

            <Form.Item label="启用状态" name="enabled" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          </Skeleton>
        </Form>
      </Modal>
    </>
  );
};
