import { shaWithSalt } from "@/utils/crypto";
import { Button, Input, InputRef, Tabs, TabsProps } from "antd";
import { useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useLogin } from "../../services/auth";
import { login } from "../../store/user";
import { messageError } from "@/utils/message";
import { UserOutlined, KeyOutlined } from "@ant-design/icons";
import { useGetApplicationDetail } from "@/services/application";
import { PageLoading } from "@/components/page-loading";
import { useLoginSuccess } from "./use-login-success";
import {
  useGetLoginOptions,
  useVerifyLogin,
  useWebAuthnEnabled,
} from "../../services/webauthn";
import { startAuthentication, WebAuthnError } from "@simplewebauthn/browser";
import { AxiosError } from "axios";
import { SELF_APP_ID, THEME_BUTTON_COLOR } from "@/config";
import { usePageTitle } from "@/store/global";
import { handleWebAuthnBrowserError } from "@/utils/web-authn";
import { localLastLoginUsername } from "@/store/lcoal";
import { EmptyTip } from "@/components/empty-tip";

export const LoginPage = () => {
  usePageTitle("登录");
  /** 用户名 */
  const [username, setUsername] = useState(localLastLoginUsername.get() || "");
  /** 密码 */
  const [password, setPassword] = useState("");
  /** 用户名输入框 */
  const usernameInputRef = useRef<InputRef>(null);
  /** 密码输入框 */
  const passwordInputRef = useRef<InputRef>(null);
  /** 提交登录 */
  const { mutateAsync: postLogin, isPending: isLogin } = useLogin();
  const { webAuthnEnabled } = useWebAuthnEnabled();

  // WebAuthn 相关 hooks
  const { mutateAsync: getLoginOptions } = useGetLoginOptions();
  const { mutateAsync: verifyLogin, isPending: isWebAuthnLogin } =
    useVerifyLogin();

  const { appId } = useParams();
  const [searchParams] = useSearchParams();

  const { runLoginSuccess } = useLoginSuccess(appId);

  const { appDetail, isLoading: loadingAppDetail } =
    useGetApplicationDetail(appId);

  // 账号密码登录
  const onPasswordSubmit = async () => {
    if (!username) {
      messageError("请输入用户名");
      usernameInputRef.current?.focus();
      return;
    }

    if (!password) {
      messageError("请输入密码");
      passwordInputRef.current?.focus();
      return;
    }

    const resp = await postLogin({
      username,
      password: shaWithSalt(password, username),
    });
    if (resp?.code !== 200) return;

    login(resp.data);
    localLastLoginUsername.set(username);
    runLoginSuccess(resp.data.token);
  };

  // WebAuthn 登录
  const onWebAuthnLogin = async () => {
    if (!username) {
      messageError("请输入用户名");
      return;
    }

    try {
      const optionsResp = await getLoginOptions({ username });

      const credential = await startAuthentication({
        optionsJSON: optionsResp.data,
      });

      const verificationResp = await verifyLogin({
        username,
        credential,
      });

      if (verificationResp.data.verified) {
        // 保存 JWT token
        login({ token: verificationResp.data.token });
        localLastLoginUsername.set(username);
        runLoginSuccess(verificationResp.data.token);
      } else {
        messageError("验证失败");
      }
    } catch (error) {
      if (error instanceof WebAuthnError) {
        handleWebAuthnBrowserError(error);
        return;
      }

      if (error instanceof AxiosError) {
        console.error("WebAuthn authentication error:", error);
        return;
      }

      console.error("WebAuthn authentication error:", error);
      messageError("登录失败：" + (error as Error).message);
    }
  };

  // 处理回车键
  const onPasswordInputKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onPasswordSubmit();
  };

  if (loadingAppDetail) {
    return <PageLoading />;
  }

  const loginTabs: TabsProps["items"] = [
    {
      key: "password",
      label: "账号密码",
      children: (
        <>
          <Input
            size="large"
            className="mb-2"
            ref={usernameInputRef}
            placeholder="请输入用户名"
            prefix={<UserOutlined />}
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                passwordInputRef.current?.focus();
              }
            }}
          />

          <Input.Password
            size="large"
            className="mb-2"
            ref={passwordInputRef}
            placeholder="请输入密码"
            prefix={<KeyOutlined />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyUp={onPasswordInputKeyUp}
          />

          <Button
            size="large"
            block
            loading={isLogin || isWebAuthnLogin}
            type="primary"
            style={{ background: THEME_BUTTON_COLOR }}
            onClick={onPasswordSubmit}
          >
            登 录
          </Button>
        </>
      ),
    },
  ];

  if (webAuthnEnabled) {
    loginTabs.push({
      key: "webauthn",
      label: "安全秘钥",
      children: (
        <>
          <Input
            size="large"
            className="mb-4"
            placeholder="请输入用户名"
            prefix={<UserOutlined />}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === "Enter") onWebAuthnLogin();
            }}
          />

          <Button
            size="large"
            block
            icon={<KeyOutlined />}
            type="primary"
            style={{ background: THEME_BUTTON_COLOR }}
            onClick={onWebAuthnLogin}
          >
            使用安全密钥登录
          </Button>
          <div
            style={{
              marginTop: 8,
              fontSize: "12px",
              color: "#666",
              textAlign: "center",
            }}
          >
            请先在"个人资料"页面注册安全密钥
          </div>
        </>
      ),
    });
  }

  if (appDetail?.registrationMode) {
    return (
      <div className="h-screen w-screen bg-gray-100 dark:bg-neutral-800 flex flex-col justify-center items-center dark:text-gray-100">
        <EmptyTip
          title="未知应用"
          subTitle="请先创建应用或联系管理员"
          extra={
            <Link to={`/login/${SELF_APP_ID}`}>
              <Button className="mt-4" type="primary">
                跳转至登录页面
              </Button>
            </Link>
          }
        ></EmptyTip>
      </div>
    );
  }

  const appTitle = searchParams.get("appTitle") || appDetail?.name;
  const appSubTitle = searchParams.get("appSubTitle") || appDetail?.subTitle;

  return (
    <div className="h-screen w-screen bg-gray-100 dark:bg-neutral-800 flex flex-col justify-center items-center dark:text-gray-100">
      <header className="w-screen text-center min-h-[236px]">
        <div className="text-5xl font-bold text-mainColor dark:text-neutral-200">
          {appTitle}
        </div>
        <div className="mt-4 text-xl text-mainColor dark:text-neutral-300">
          {appSubTitle}
        </div>
      </header>
      <div className="w-[70%] md:w-[40%] lg:w-[30%] xl:w-[20%] flex flex-col items-center">
        <Tabs defaultActiveKey="password" centered items={loginTabs} />
      </div>
    </div>
  );
};
