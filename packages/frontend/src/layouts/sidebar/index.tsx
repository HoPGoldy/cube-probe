import { FC } from "react";
import { Link, useLocation } from "react-router-dom";
import s from "./styles.module.css";
import { useAtomValue } from "jotai";
import { stateUserJwtData } from "@/store/user";
import { UserRole } from "@/services/user";
import { useGetMonitoredHostList } from "@/services/monitored-host";
import { Button, Flex } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useHostDetailAction } from "@/pages/host-detail/use-detail-action";

interface MenuItem {
  path: string;
  name: string;
}

export const Sidebar: FC = () => {
  const location = useLocation();
  const userInfo = useAtomValue(stateUserJwtData);

  const { data: hostsData } = useGetMonitoredHostList({});
  const hosts = hostsData?.data ?? [];

  const hostDetailActions = useHostDetailAction();

  const menuItems: MenuItem[] = [
    {
      path: "/user-profile",
      name: "个人资料",
    },
  ];

  if (userInfo.role === UserRole.ADMIN) {
    menuItems.push(
      {
        path: "/setting-application",
        name: "应用管理",
      },
      {
        path: "/setting-user",
        name: "用户管理",
      },
      {
        path: "/monitored-host",
        name: "监控服务",
      },
      {
        path: "/monitored-endpoint",
        name: "监控端点",
      },
      {
        path: "/probe-result",
        name: "探测结果",
      },
      {
        path: "/notification-channel",
        name: "通知渠道",
      },
      {
        path: "/notification-log",
        name: "通知记录",
      },
    );
  }

  const renderMenuItem = (item: MenuItem) => {
    const className = [s.menuItem];
    if (item.path === location.pathname) className.push(s.menuItemActive);

    return (
      <Link to={item.path} key={item.path}>
        <div className={className.join(" ")} title={item.name}>
          <span className="truncate">{item.name}</span>
        </div>
      </Link>
    );
  };

  return (
    <section className={s.sideberBox}>
      <div className="flex flex-row flex-nowrap items-center justify-center">
        <div className="font-black text-lg">Cube Auth</div>
      </div>

      <div className="flex-grow flex-shrink overflow-y-auto noscrollbar overflow-x-hidden my-3">
        {/* {menuItems.map(renderMenuItem)} */}

        {hosts.length > 0 && (
          <>
            {hosts.map((host: any) => {
              const isActive = location.pathname === `/host-home/${host.id}`;
              const className = [s.menuItem];
              if (isActive) className.push(s.menuItemActive);

              return (
                <Link to={`/host-home/${host.id}`} key={host.id}>
                  <div
                    className={className.join(" ")}
                    title={`${host.name} (${host.host}:${host.port})`}
                  >
                    <span className="truncate">{host.name}</span>
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </div>

      <Flex vertical gap={8}>
        {userInfo.role === UserRole.ADMIN && (
          <Button
            className={`${s.toolBtn} keep-antd-style`}
            icon={<PlusOutlined />}
            block
            onClick={hostDetailActions.onAdd}
          >
            创建监控服务
          </Button>
        )}
        {userInfo.role === UserRole.ADMIN && (
          <Link to="/probe-env">
            <Button className={`${s.toolBtn} keep-antd-style`} block>
              环境变量
            </Button>
          </Link>
        )}
        {userInfo.role === UserRole.ADMIN && (
          <Link to="/home">
            <Button className={`${s.toolBtn} keep-antd-style`} block>
              主面板
            </Button>
          </Link>
        )}
      </Flex>
    </section>
  );
};
