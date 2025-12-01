import React, { useEffect } from "react";
import { Modal, Form, Input, Switch, Select, InputNumber, App } from "antd";
import { useSearchParams } from "react-router-dom";
import { useDetailType } from "@/utils/use-detail-type";
import {
  useCreateRule,
  useUpdateRule,
  useGetRuleDetail,
  useGetChannelList,
  RuleCreateDto,
  NotificationScopeType,
} from "@/services/notification";
import { useGetMonitoredHostList } from "@/services/monitored-host";
import { useGetEndpointList } from "@/services/monitored-endpoint";

export const DetailModal: React.FC = () => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const detailType = searchParams.get("modal");
  const itemId = searchParams.get("id") ?? "";
  const isOpen = !!detailType;
  const { isAdd, isEdit } = useDetailType(detailType ?? undefined);

  const scopeType = Form.useWatch("scopeType", form);

  const { data: detailData } = useGetRuleDetail(itemId);
  const { data: channelListData } = useGetChannelList();
  const { data: hostListData } = useGetMonitoredHostList({});
  const { data: endpointListData } = useGetEndpointList();
  const { mutateAsync: createRule, isPending: createLoading } = useCreateRule();
  const { mutateAsync: updateRule, isPending: updateLoading } = useUpdateRule();

  const channels = (channelListData?.data as any[]) ?? [];
  const hosts = (hostListData?.data?.items as any[]) ?? [];
  const endpoints = (endpointListData?.data as any[]) ?? [];
  const detailRecord = detailData?.data as any;

  useEffect(() => {
    if (isEdit && detailRecord) {
      form.setFieldsValue({
        name: detailRecord.name,
        enabled: detailRecord.enabled,
        scopeType: detailRecord.scopeType,
        hostId: detailRecord.hostId,
        endpointId: detailRecord.endpointId,
        consecutiveFailures: detailRecord.consecutiveFailures,
        cooldownMinutes: detailRecord.cooldownMinutes,
        notifyOnRecovery: detailRecord.notifyOnRecovery,
        channelId: detailRecord.channelId,
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

    const data: RuleCreateDto = {
      name: values.name,
      enabled: values.enabled ?? true,
      scopeType: values.scopeType,
      hostId: values.scopeType === "HOST" ? values.hostId : null,
      endpointId: values.scopeType === "ENDPOINT" ? values.endpointId : null,
      consecutiveFailures: values.consecutiveFailures,
      cooldownMinutes: values.cooldownMinutes,
      notifyOnRecovery: values.notifyOnRecovery,
      channelId: values.channelId,
    };

    if (isAdd) {
      await createRule(data);
      message.success("创建成功");
    } else if (isEdit) {
      await updateRule({ id: itemId, ...data });
      message.success("更新成功");
    }

    onClose();
  };

  const title = isAdd ? "新增通知规则" : "编辑通知规则";

  return (
    <Modal
      title={title}
      open={isOpen}
      onCancel={onClose}
      onOk={onSubmit}
      confirmLoading={createLoading || updateLoading}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          enabled: true,
          scopeType: "ALL" as NotificationScopeType,
          consecutiveFailures: 3,
          cooldownMinutes: 30,
          notifyOnRecovery: true,
        }}
        className="mt-4"
      >
        <Form.Item
          name="name"
          label="规则名称"
          rules={[{ required: true, message: "请输入规则名称" }]}
        >
          <Input placeholder="如：生产环境告警" />
        </Form.Item>

        <Form.Item
          name="channelId"
          label="通知渠道"
          rules={[{ required: true, message: "请选择通知渠道" }]}
        >
          <Select
            placeholder="选择通知渠道"
            options={channels.map((c) => ({
              label: c.name,
              value: c.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="scopeType"
          label="作用范围"
          rules={[{ required: true, message: "请选择作用范围" }]}
        >
          <Select
            placeholder="选择作用范围"
            options={[
              { label: "全局 - 所有端点", value: "ALL" },
              { label: "指定服务 - 服务下所有端点", value: "HOST" },
              { label: "指定端点 - 单个端点", value: "ENDPOINT" },
            ]}
          />
        </Form.Item>

        {scopeType === "HOST" && (
          <Form.Item
            name="hostId"
            label="选择服务"
            rules={[{ required: true, message: "请选择服务" }]}
          >
            <Select
              placeholder="选择服务"
              showSearch
              optionFilterProp="label"
              options={hosts.map((h) => ({
                label: h.name,
                value: h.id,
              }))}
            />
          </Form.Item>
        )}

        {scopeType === "ENDPOINT" && (
          <Form.Item
            name="endpointId"
            label="选择端点"
            rules={[{ required: true, message: "请选择端点" }]}
          >
            <Select
              placeholder="选择端点"
              showSearch
              optionFilterProp="label"
              options={endpoints.map((e) => ({
                label: `${e.name}`,
                value: e.id,
              }))}
            />
          </Form.Item>
        )}

        <Form.Item
          name="consecutiveFailures"
          label="连续失败次数"
          rules={[{ required: true, message: "请输入连续失败次数" }]}
          extra="端点连续失败达到此次数后才会触发通知"
        >
          <InputNumber min={1} max={100} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="cooldownMinutes"
          label="冷却时间（分钟）"
          rules={[{ required: true, message: "请输入冷却时间" }]}
          extra="同一端点在冷却时间内不会重复发送通知"
        >
          <InputNumber min={0} max={1440} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="notifyOnRecovery"
          label="恢复时通知"
          valuePropName="checked"
          extra="端点从故障状态恢复正常时是否发送通知"
        >
          <Switch checkedChildren="是" unCheckedChildren="否" />
        </Form.Item>

        <Form.Item name="enabled" label="启用状态" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
