import { createLocalInstance } from "@/utils/localstorage";

export const prefix = "$cube-auth-";

/** 请求 token */
export const localAccessToken = createLocalInstance(prefix + "access-token");

/** 上次登录成功的用户名 */
export const localLastLoginUsername = createLocalInstance(
  prefix + "last-login-username",
);
