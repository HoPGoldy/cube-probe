import { EmptyTip } from "@/components/empty-tip";
import { useGetAppConfig, useUpdateAppConfig } from "@/services/app-config";
import { Button, Card, Flex } from "antd";

export const WebAuthnInitCard = () => {
  const { appConfig, isLoading } = useGetAppConfig();
  const { mutateAsync: updateAppConfig, isPending: isUpdating } =
    useUpdateAppConfig();

  const webAuthnInitialized =
    appConfig.WEB_AUTHN_ORIGIN &&
    appConfig.WEB_AUTHN_RP_ID &&
    appConfig.WEB_AUTHN_RP_NAME;

  const onInitWebAuthn = () => {
    const defaultOrigin = window.location.origin;
    const defaultRpId = window.location.hostname;
    const defaultRpName = "Cube Auth";

    updateAppConfig({
      WEB_AUTHN_ORIGIN: defaultOrigin,
      WEB_AUTHN_RP_ID: defaultRpId,
      WEB_AUTHN_RP_NAME: defaultRpName,
    });
  };

  const onDisableWebAuthn = () => {
    updateAppConfig({
      WEB_AUTHN_ORIGIN: "",
      WEB_AUTHN_RP_ID: "",
      WEB_AUTHN_RP_NAME: "",
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (webAuthnInitialized) {
      return (
        <EmptyTip
          title={<div className="text-green-500">WebAuthn 已启用</div>}
          subTitle={
            <Flex
              vertical
              justify="center"
              align="center"
              className="text-center"
            >
              <div>可以在登录时可以使用安全令牌进行登录</div>
              <div>
                当前注册域名: {appConfig.WEB_AUTHN_ORIGIN}
                ，请确保该值和实际访问域名一致，否则可能会导致安全令牌无法使用
              </div>
            </Flex>
          }
        ></EmptyTip>
      );
    }

    return (
      <EmptyTip
        title="WebAuthn 未启用"
        subTitle="将无法使用安全令牌进行登录，点击下方按钮进行初始化"
        extra={
          <Button loading={isUpdating} onClick={onInitWebAuthn}>
            启用 WebAuthn
          </Button>
        }
      ></EmptyTip>
    );
  };

  return (
    <Card
      className="w-full"
      title="webAuthn 状态"
      extra={
        webAuthnInitialized ? (
          <Button danger loading={isUpdating} onClick={onDisableWebAuthn}>
            禁用 WebAuthn
          </Button>
        ) : null
      }
    >
      {renderContent()}
    </Card>
  );
};
