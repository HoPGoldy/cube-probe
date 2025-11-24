import { EmptyTip } from "@/components/empty-tip";
import { useIsMobile } from "@/layouts/responsive";
import {
  useGetRegistrationOptions,
  useVerifyRegistration,
  useGetCredentials,
  useDeleteCredential,
  WebAuthnCredential,
  useWebAuthnEnabled,
} from "@/services/webauthn";
import { messageError, messageSuccess } from "@/utils/message";
import { handleWebAuthnBrowserError } from "@/utils/web-authn";
import { PlusOutlined, DeleteOutlined, KeyOutlined } from "@ant-design/icons";
import { startRegistration, WebAuthnError } from "@simplewebauthn/browser";
import { Button, Card, Flex, Modal } from "antd";
import { useState } from "react";
import { UAParser } from "ua-parser-js";

const createCredentialName = () => {
  const parser = new UAParser();
  const result = parser.getResult();

  return `${result.browser.name || "Unknown Browser"} - ${
    result.os.name || "Unknown OS"
  }`;
};

export const WebAuthnListCard = () => {
  const [modal, contextHolder] = Modal.useModal();
  const { webAuthnEnabled } = useWebAuthnEnabled();
  const isMobile = useIsMobile();

  const { mutateAsync: getRegistrationOptions } = useGetRegistrationOptions();
  const { mutateAsync: verifyRegistration } = useVerifyRegistration();
  const { data: credentialsData, refetch: refetchCredentials } =
    useGetCredentials();
  const { mutateAsync: deleteCredential } = useDeleteCredential();

  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async () => {
    try {
      setIsRegistering(true);

      const optionsResp = await getRegistrationOptions();

      const attResp = await startRegistration({
        optionsJSON: optionsResp.data,
      });

      const name = createCredentialName();

      const verificationResp = await verifyRegistration({
        credential: attResp,
        credentialName: name,
      });

      if (verificationResp.data.verified) {
        messageSuccess("安全密钥注册成功！");
        refetchCredentials();
      } else {
        messageError("注册失败！");
      }
    } catch (error) {
      if (error instanceof WebAuthnError) {
        handleWebAuthnBrowserError(error);
        return;
      }

      messageError("注册失败：" + (error as Error).message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeleteCredential = (credentialId: string) => {
    modal.confirm({
      title: "确认删除凭证？",
      content: "这个操作将永久删除选定的安全凭证。",
      onOk: async () => {
        try {
          await deleteCredential(credentialId);
          messageSuccess("删除成功！");
          refetchCredentials();
        } catch (error) {
          messageError("删除失败：" + (error as Error).message);
        }
      },
    });
  };

  const credentials = credentialsData?.data || [];

  const renderCredentialItem = (item: WebAuthnCredential) => {
    return (
      <Flex
        key={item.id}
        justify="space-between"
        align="center"
        gap={16}
        className="overflow-hidden"
      >
        <Flex align="center" gap={16} className="overflow-hidden">
          <KeyOutlined
            className={`${isMobile ? "text-[32px]" : "text-[48px]"} flex-shrink-0`}
          />
          <div className="overflow-hidden">
            <div className="text-base">{item.name}</div>
            <div
              className="text-sm text-gray-500 truncate"
              style={{ marginTop: 4 }}
            >
              {item.credentialID}
            </div>
            <div className="text-sm text-gray-500">
              注册于: {new Date(item.createdAt).toLocaleString()}
            </div>
          </div>
        </Flex>
        <div className="flex-shrink-0">
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => {
              console.log("删除凭证", item);
              handleDeleteCredential(item.id);
            }}
          >
            删除
          </Button>
        </div>
      </Flex>
    );
  };

  if (!webAuthnEnabled) {
    return null;
  }

  return (
    <Card
      title="安全密钥 (WebAuthn)"
      style={{ width: "100%" }}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleRegister}
          loading={isRegistering}
        >
          添加安全密钥
        </Button>
      }
    >
      {contextHolder}
      {credentials.length > 0 ? (
        credentials.map(renderCredentialItem)
      ) : (
        <EmptyTip
          title="尚未注册任何安全密钥"
          subTitle='点击右上方"添加安全密钥"按钮开始注册'
        />
      )}
    </Card>
  );
};
