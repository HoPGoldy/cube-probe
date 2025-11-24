import { useEffect } from "react";
import { login, stateUserToken } from "@/store/user";
import { useAtom } from "jotai";
import { LoginPage } from "./page";
import { PageLoading } from "@/components/page-loading";
import { useRefreshToken } from "@/services/auth";
import { useLoginSuccess } from "./use-login-success";
import { useParams } from "react-router-dom";

const Login = () => {
  const { appId } = useParams();
  const [userToken, setUserToken] = useAtom(stateUserToken);
  const { mutateAsync: refreshToken, isPending: renewLoading } =
    useRefreshToken();

  const { runLoginSuccess } = useLoginSuccess(appId);

  useEffect(() => {
    if (!userToken) return;
    // 进登录页面发现 token 还在，试一下 token 能不能用，能用就跳转回去
    // 只在页面初始化的时候执行一次

    const runRenew = async () => {
      const resp = await refreshToken();
      console.log("resp", resp);
      if (!resp.success) {
        setUserToken("");
        return;
      }

      login(resp.data);
      runLoginSuccess(resp.data.token);
    };

    runRenew();
  }, []);

  if (userToken || renewLoading) {
    return <PageLoading />;
  }

  return <LoginPage />;
};

export default Login;
