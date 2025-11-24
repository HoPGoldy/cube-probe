import { FC, PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { stateUserJwtData } from "../store/user";
import { useAtomValue } from "jotai";
import { SELF_APP_ID } from "@/config";

export const LoginAuth: FC<PropsWithChildren> = ({ children }) => {
  const userInfo = useAtomValue(stateUserJwtData);

  if (!userInfo) {
    return <Navigate to={`/login/${SELF_APP_ID}`} replace />;
  }

  return <>{children}</>;
};
