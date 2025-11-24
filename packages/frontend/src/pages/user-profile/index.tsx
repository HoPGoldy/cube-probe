import { useState } from "react";
import { Card, Flex, Descriptions } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { useAtomValue } from "jotai";
import { logout, stateUserJwtData } from "@/store/user";
import { usePageTitle } from "@/store/global";
import {
  ActionButton,
  ActionIcon,
  PageAction,
  PageContent,
} from "@/layouts/page-with-action";
import { MobileSetting } from "../user-setting";
import { WebAuthnInitCard } from "./webauthn-init";
import { UserRole } from "@/services/user";
import { WebAuthnListCard } from "./webauthn-list";
import { SystemSettingCard } from "./system-setting";

const UserProfilePage = () => {
  usePageTitle("个人资料");
  const [mobileSettingVisible, setMobileSettingVisible] = useState(false);

  // 从全局状态获取用户信息
  const userInfo = useAtomValue(stateUserJwtData);

  return (
    <>
      <PageContent>
        <Flex vertical gap={16} className="p-4 max-w-[600px] mx-auto">
          <Card title="用户信息" style={{ width: "100%" }}>
            <Descriptions
              items={[
                {
                  label: "用户名",
                  children: userInfo?.username || "N/A",
                },
                {
                  label: "角色",
                  children: userInfo?.role || "N/A",
                },
              ]}
            />
          </Card>

          <WebAuthnListCard />

          {userInfo.role === UserRole.ADMIN && <WebAuthnInitCard />}

          {userInfo.role === UserRole.ADMIN && <SystemSettingCard />}
        </Flex>
      </PageContent>
      <MobileSetting
        visible={mobileSettingVisible}
        onVisibleChange={setMobileSettingVisible}
      />
      <PageAction>
        <ActionIcon
          icon={<SettingOutlined />}
          onClick={() => setMobileSettingVisible(true)}
        ></ActionIcon>
        <ActionButton onClick={() => logout()}>登出</ActionButton>
      </PageAction>
    </>
  );
};

export default UserProfilePage;
