import { FC } from "react";
import { Modal } from "antd";
import { useIsMobile } from "@/layouts/responsive";
import { Col, Form, Input, Row } from "antd";
import { useChangePassword } from "@/services/user";
import { shaWithSalt } from "@/utils/crypto";
import { logout, stateUserJwtData } from "@/store/user";
import { messageSuccess } from "@/utils/message";
import s from "./styles.module.css";
import { useAtomValue } from "jotai";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: FC<ChangePasswordModalProps> = (props) => {
  const [form] = Form.useForm();
  const isMobile = useIsMobile();
  const userInfo = useAtomValue(stateUserJwtData);
  const { mutateAsync: postChangePassword } = useChangePassword();

  const onSavePassword = async () => {
    const values = await form.validateFields();
    const resp = await postChangePassword({
      oldP: shaWithSalt(values.oldPassword, userInfo.username),
      newP: shaWithSalt(values.newPassword, userInfo.username),
    });
    if (resp.code !== 200) return false;

    logout();
    messageSuccess("密码修改成功，请重新登录");
    return true;
  };

  return (
    <Modal
      open={props.open}
      onCancel={() => props.onClose()}
      onOk={async () => {
        const success = await onSavePassword();
        if (success) props.onClose();
      }}
      title="修改密码"
    >
      <Form
        className={s.changePasswordBox}
        form={form}
        labelCol={{ span: 6 }}
        labelAlign="right"
        size={isMobile ? "large" : "middle"}
      >
        <Row className="md:mt-6">
          <Col span={24}>
            <Form.Item
              label="旧密码"
              name="oldPassword"
              rules={[{ required: true, message: "请填写旧密码" }]}
            >
              <Input.Password placeholder="请输入" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="新密码"
              name="newPassword"
              hasFeedback
              rules={[
                { required: true, message: "请填写新密码" },
                { min: 6, message: "密码长度至少6位" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("oldPassword") !== value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("新旧密码不能相同"));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请输入" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="重复新密码"
              name="confirmPassword"
              rules={[
                { required: true, message: "请重复新密码" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("与新密码不一致"));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请输入" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
