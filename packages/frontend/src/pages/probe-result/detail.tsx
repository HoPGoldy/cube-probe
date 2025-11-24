import { useDetailType } from "@/utils/use-detail-type";
import { FC, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Skeleton,
  Switch,
} from "antd";
import {
  useCreateProbeResult,
  useGetProbeResultDetail,
} from "@/services/probe-result";
import { useGetEndpointList } from "@/services/monitored-endpoint";
import dayjs from "dayjs";

export const DetailModal: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const detailType = searchParams.get("modal");
  const detailId = searchParams.get("id");

  const isOpen = !!detailType;
  const { isAdd, isReadonly } = useDetailType(detailType);

  const { mutateAsync: runAddResult, isPending: adding } =
    useCreateProbeResult();
  const { data: resultDetailResp, isLoading } =
    useGetProbeResultDetail(detailId);
  const { data: endpointsResp } = useGetEndpointList({});

  const resultDetail = resultDetailResp?.data;
  const endpoints = endpointsResp?.data ?? [];

  useEffect(() => {
    const convert = async () => {
      if (!resultDetail) return;

      const formValues = {
        ...resultDetail,
        timestamp: resultDetail.timestamp
          ? dayjs(resultDetail.timestamp)
          : null,
      };

      form.setFieldsValue(formValues);
    };

    convert();
  }, [resultDetail]);

  const [form] = Form.useForm();

  const onCancel = () => {
    searchParams.delete("modal");
    searchParams.delete("id");
    setSearchParams(searchParams, { replace: true });
  };

  const onSave = async () => {
    await form.validateFields();
    const values = form.getFieldsValue();

    // Convert timestamp to ISO string
    if (values.timestamp) {
      values.timestamp = values.timestamp.toISOString();
    }

    if (isAdd) {
      const resp = await runAddResult(values);
      if (resp?.code !== 200) return false;
    }

    onCancel();
    return true;
  };

  return (
    <>
      <Modal
        title={
          isAdd ? "新增探测结果" : isReadonly ? "查看探测结果" : "编辑探测结果"
        }
        open={isOpen}
        onOk={onSave}
        width={600}
        loading={isLoading || adding}
        onCancel={onCancel}
        footer={isReadonly ? null : undefined}
        afterClose={() => {
          form.resetFields();
        }}
      >
        <Form
          form={form}
          layout="vertical"
          disabled={isReadonly}
          initialValues={{
            success: true,
            timestamp: dayjs(),
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
              label="监控端点"
              name="endPointId"
              rules={[{ required: true, message: "请选择监控端点" }]}
            >
              <Select
                placeholder="请选择监控端点"
                options={endpoints.map((e: any) => ({
                  label: e.name,
                  value: e.id,
                }))}
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                disabled={isReadonly}
              />
            </Form.Item>

            <Form.Item label="HTTP状态码" name="status">
              <InputNumber
                style={{ width: "100%" }}
                min={100}
                max={599}
                placeholder="200"
              />
            </Form.Item>

            <Form.Item label="响应时间 (毫秒)" name="responseTime">
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                max={300000}
                placeholder="100"
              />
            </Form.Item>

            <Form.Item
              label="执行时间"
              name="timestamp"
              rules={[{ required: true, message: "请选择执行时间" }]}
            >
              <DatePicker
                showTime
                style={{ width: "100%" }}
                placeholder="选择执行时间"
                format="YYYY-MM-DD HH:mm:ss"
              />
            </Form.Item>

            <Form.Item
              label="执行结果"
              name="success"
              valuePropName="checked"
              rules={[{ required: true, message: "请设置执行结果" }]}
            >
              <Switch checkedChildren="成功" unCheckedChildren="失败" />
            </Form.Item>

            <Form.Item label="消息" name="message">
              <Input.TextArea rows={4} placeholder="请输入详细信息或错误消息" />
            </Form.Item>
          </Skeleton>
        </Form>
      </Modal>
    </>
  );
};
