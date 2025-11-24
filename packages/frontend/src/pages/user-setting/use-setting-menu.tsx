import React, { useState } from "react";
import { logout, stateUserJwtData } from "@/store/user";
import { LockOutlined, SmileOutlined } from "@ant-design/icons";
import { useAtomValue } from "jotai";

export interface SettingLinkItem {
  label: string;
  icon: React.ReactNode;
  onClick?: () => unknown;
}

export const useSettingMenu = () => {
  const userInfo = useAtomValue(stateUserJwtData);
  /** 是否显示修改密码弹窗 */
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  /** 是否展示关于弹窗 */
  const [aboutVisible, setAboutVisible] = useState(false);

  const settingConfig = [
    {
      label: "修改密码",
      icon: <LockOutlined />,
      onClick: () => setChangePasswordVisible(true),
    },
    {
      label: "关于",
      icon: <SmileOutlined />,
      onClick: () => setAboutVisible(true),
    },
  ].filter(Boolean) as SettingLinkItem[];

  const onLogout = () => {
    logout();
  };

  const userName = userInfo?.username || "---";

  return {
    userName,
    onLogout,
    changePasswordVisible,
    setChangePasswordVisible,
    aboutVisible,
    setAboutVisible,
    settingConfig,
  };
};
