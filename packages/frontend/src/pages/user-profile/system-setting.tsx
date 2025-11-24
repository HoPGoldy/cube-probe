import { useGetAppConfig, useUpdateAppConfig } from "@/services/app-config";
import { messageSuccess } from "@/utils/message";
import { Card, Form, Segmented } from "antd";

export const SystemSettingCard = () => {
  const [form] = Form.useForm();
  const { appConfig, isLoading } = useGetAppConfig();
  const { mutateAsync: updateAppConfig, isPending: isUpdating } =
    useUpdateAppConfig();

  const onSave = async () => {
    const values = form.getFieldsValue();
    await updateAppConfig({
      REGISTRATION_MODE_ENABLED: values.REGISTRATION_MODE_ENABLED,
    });
    messageSuccess("系统设置已保存");
  };

  const configFormInitialValues = {
    REGISTRATION_MODE_ENABLED: appConfig.REGISTRATION_MODE_ENABLED || "false",
  };

  const renderContent = () => {
    if (isLoading) {
      return <div>Loading...</div>;
    }

    return (
      <Form
        form={form}
        initialValues={configFormInitialValues}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        onValuesChange={onSave}
        style={{
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <Form.Item
          label="是否启用注册模式"
          name="REGISTRATION_MODE_ENABLED"
          tooltip="默认关闭，开启后在应用管理中创建的应用才允许登录"
        >
          <Segmented<string>
            options={[
              { label: "启用", value: "true" },
              { label: "关闭", value: "false" },
            ]}
          />
        </Form.Item>
      </Form>
    );
  };

  return (
    <Card
      className="w-full"
      title="系统设置"
      extra={isUpdating && <div>保存中...</div>}
    >
      {renderContent()}
    </Card>
  );
};
