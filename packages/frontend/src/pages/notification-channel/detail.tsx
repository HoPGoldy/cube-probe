import React, { useEffect } from "react";
import { Modal, Form, Input, Switch, Select, App } from "antd";
import { useSearchParams } from "react-router-dom";
import { useDetailType } from "@/utils/use-detail-type";
import {
  useCreateChannel,
  useUpdateChannel,
  useGetChannelDetail,
  useGetChannelTemplates,
  ChannelCreateDto,
} from "@/services/notification";

const { TextArea } = Input;

export const DetailModal: React.FC = () => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const detailType = searchParams.get("modal");
  const itemId = searchParams.get("id") ?? "";
  const isOpen = !!detailType;
  const { isAdd, isEdit } = useDetailType(detailType ?? undefined);

  const { data: detailData } = useGetChannelDetail(itemId);
  const { data: templatesData } = useGetChannelTemplates();
  const { mutateAsync: createChannel, isPending: createLoading } =
    useCreateChannel();
  const { mutateAsync: updateChannel, isPending: updateLoading } =
    useUpdateChannel();

  const templates = (templatesData?.data as any[]) ?? [];
  const detailRecord = detailData?.data as any;

  useEffect(() => {
    if (isEdit && detailRecord) {
      form.setFieldsValue({
        name: detailRecord.name,
        webhookUrl: detailRecord.webhookUrl,
        bodyTemplate: detailRecord.bodyTemplate,
        enabled: detailRecord.enabled,
        headers: detailRecord.headers
          ? JSON.stringify(detailRecord.headers, null, 2)
          : "",
      });
    } else if (isAdd) {
      form.resetFields();
    }
  }, [isEdit, isAdd, detailRecord, form]);

  const onClose = () => {
    searchParams.delete("modal");
    searchParams.delete("id");
    setSearchParams(searchParams, { replace: true });
    form.resetFields();
  };

  const onSubmit = async () => {
    const values = await form.validateFields();

    // 解析 headers JSON
    let headers = null;
    if (values.headers) {
      try {
        headers = JSON.parse(values.headers);
      } catch {
        message.error("请求头 JSON 格式不正确");
        return;
      }
    }

    const data: ChannelCreateDto = {
      name: values.name,
      webhookUrl: values.webhookUrl,
      bodyTemplate: values.bodyTemplate,
      enabled: values.enabled ?? true,
      headers,
    };

    if (isAdd) {
      await createChannel(data);
      message.success("创建成功");
    } else if (isEdit) {
      await updateChannel({ id: itemId, ...data });
      message.success("更新成功");
    }

    onClose();
  };

  const onTemplateSelect = (templateIndex: number) => {
    const template = templates[templateIndex];
    if (template) {
      form.setFieldValue("bodyTemplate", template.template);
    }
  };

  const title = isAdd ? "新增通知渠道" : "编辑通知渠道";

  return (
    <Modal
      title={title}
      open={isOpen}
      onCancel={onClose}
      onOk={onSubmit}
      confirmLoading={createLoading || updateLoading}
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ enabled: true }}
        className="mt-4"
      >
        <Form.Item
          name="name"
          label="渠道名称"
          rules={[{ required: true, message: "请输入渠道名称" }]}
        >
          <Input placeholder="如：运维钉钉群" />
        </Form.Item>

        <Form.Item
          name="webhookUrl"
          label="Webhook URL"
          rules={[
            { required: true, message: "请输入 Webhook URL" },
            { type: "url", message: "请输入有效的 URL" },
          ]}
        >
          <Input placeholder="https://oapi.dingtalk.com/robot/send?access_token=xxx" />
        </Form.Item>

        <Form.Item name="headers" label="自定义请求头 (JSON)">
          <TextArea rows={3} placeholder='{"Authorization": "Bearer xxx"}' />
        </Form.Item>

        <Form.Item label="选择预置模板">
          <Select
            placeholder="选择模板快速填充"
            allowClear
            onChange={onTemplateSelect}
            options={templates.map((t, index) => ({
              label: `${t.name} - ${t.description}`,
              value: index,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="bodyTemplate"
          label="请求体模板"
          rules={[{ required: true, message: "请输入请求体模板" }]}
          extra="支持变量: {{eventType}}, {{endpoint.name}}, {{service.name}}, {{details.status}}, {{details.message}}, {{timestamp}} 等"
        >
          <TextArea
            rows={10}
            placeholder={`{
  "msgtype": "markdown",
  "markdown": {
    "title": "{{eventType}} - {{endpoint.name}}",
    "text": "### {{eventType}}\\n- **服务**: {{service.name}}\\n- **端点**: {{endpoint.name}}"
  }
}`}
          />
        </Form.Item>

        <Form.Item name="enabled" label="启用状态" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
