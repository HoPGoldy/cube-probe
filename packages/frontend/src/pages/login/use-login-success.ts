import { SELF_APP_ID } from "@/config";
import { useNavigate, useSearchParams } from "react-router-dom";

const getTargetUrl = (path: string) => {
  // 处理空或无效输入
  if (!path || typeof path !== "string") {
    return null;
  }

  try {
    return new URL(decodeURIComponent(path), window.location.href);
  } catch (error) {
    console.error("Invalid URL provided:", path, error);
    return null;
  }
};

export const useLoginSuccess = (appId: string) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const runLoginSuccess = (token: string) => {
    let nextUrl = searchParams.get("redirect");
    if (nextUrl) {
      nextUrl = decodeURIComponent(nextUrl);
    }

    if (appId !== SELF_APP_ID) {
      localStorage.setItem(`$cube-auth-token-${appId}`, token);
      window.location.href = getTargetUrl(nextUrl)?.toString() || "/";
      return null;
    }

    navigate(nextUrl ? nextUrl : "/", { replace: true });
  };

  return {
    runLoginSuccess,
  };
};
