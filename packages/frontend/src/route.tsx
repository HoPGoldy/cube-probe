import { ComponentType, lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import Loading from "./layouts/loading";
import { LoginAuth } from "./layouts/login-auth";
import { AppContainer } from "./layouts/app-container";
import { Error403 } from "./pages/e403";
import AttachmentDemo from "./pages/attachment-demo";
import Login from "./pages/login";
import Logout from "./pages/logout";

const lazyLoad = (
  compLoader: () => Promise<{ default: ComponentType<any> }>,
) => {
  const Comp = lazy(compLoader);
  return (
    <Suspense fallback={<Loading />}>
      <Comp />
    </Suspense>
  );
};

export const routes = createBrowserRouter(
  [
    {
      path: "/",
      children: [
        { index: true, element: <Navigate to="/user-profile" /> },
        // 用户管理
        {
          path: "/setting-user",
          element: lazyLoad(() => import("./pages/setting-user")),
        },
        // 应用管理
        {
          path: "/setting-application",
          element: lazyLoad(() => import("./pages/setting-application")),
        },
        // 个人资料
        {
          path: "/user-profile",
          element: lazyLoad(() => import("./pages/user-profile")),
        },
      ],
      element: (
        <LoginAuth>
          <AppContainer />
        </LoginAuth>
      ),
    },
    // 登录
    {
      path: "/login/:appId",
      element: <Login />,
    },
    {
      path: "/logout/:appId",
      element: <Logout />,
    },
    { path: "/e403", element: <Error403 /> },
    { path: "/file-demo", element: <AttachmentDemo /> },
  ],
  {
    basename: APP_CONFIG.PATH_BASENAME,
  },
);
