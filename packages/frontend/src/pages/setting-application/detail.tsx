import { useDetailType } from "@/utils/use-detail-type";
import { FC, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Form, Input, Modal, Skeleton } from "antd";
import {
  useCreateApplication,
  useGetApplicationDetail,
  useUpdateApplication,
} from "@/services/application";

export const DetailModal: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const detailType = searchParams.get("modal");
  const detailId = searchParams.get("id");

  const isOpen = !!detailType;
  const { isAdd, isEdit, isReadonly } = useDetailType(detailType);

  const { mutateAsync: runAddApplication, isPending: adding } =
    useCreateApplication();

  const { mutateAsync: runEditApplication, isPending: updating } =
    useUpdateApplication();

  const { data: applicationDetailResp, isLoading } = useGetApplicationDetail(
    detailId ?? "",
  );

  const applicationDetail = applicationDetailResp?.data;

  useEffect(() => {
    const convert = async () => {
      if (!applicationDetail) return;

      const formValues = {
        ...applicationDetail,
      };

      form.setFieldsValue(formValues);
    };

    convert();
  }, [applicationDetail]);

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
      await runAddApplication(values);
    } else if (isEdit) {
      await runEditApplication({ id: detailId, ...values });
    }

    onCancel();
  };

  return (
    <>
      <Modal
        title={isAdd ? "新增应用" : "编辑应用"}
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
          initialValues={{}}
          style={{
            marginTop: 16,
            maxHeight: "60vh",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <Skeleton active loading={isLoading}>
            <Form.Item
              label="应用名称"
              name="name"
              rules={[{ required: true, message: "请输入应用名称" }]}
            >
              <Input type="text" placeholder="请输入应用名称" />
            </Form.Item>
            <Form.Item label="应用副标题" name="subTitle">
              <Input type="text" placeholder="请输入应用副标题" />
            </Form.Item>
          </Skeleton>
        </Form>
      </Modal>
    </>
  );
};
