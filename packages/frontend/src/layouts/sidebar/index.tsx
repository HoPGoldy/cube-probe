import { FC } from "react";
import { Link, useLocation } from "react-router-dom";
import s from "./styles.module.css";
import { useAtomValue } from "jotai";
import { stateUserJwtData } from "@/store/user";
import { UserRole } from "@/services/user";

interface MenuItem {
  path: string;
  name: string;
}

export const Sidebar: FC = () => {
  const location = useLocation();
  const userInfo = useAtomValue(stateUserJwtData);

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
        {menuItems.map(renderMenuItem)}
      </div>

      {/* <Button
        className={`${s.toolBtn} keep-antd-style`}
        icon={<PlusOutlined />}
        block
      >
        新建分组
      </Button> */}
    </section>
  );
};
