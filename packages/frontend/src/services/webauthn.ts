import { useMutation, useQuery } from "@tanstack/react-query";
import { requestPost } from "./base";
import { AuthenticationResponseJSON } from "@simplewebauthn/browser";

export interface WebAuthnCredential {
  id: string;
  name: string;
  credentialID: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebAuthnRegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: "public-key";
    alg: number;
  }>;
  timeout: number;
  attestation: "none" | "indirect" | "direct";
  excludeCredentials: Array<{
    id: string;
    type: "public-key";
    transports?: Array<"usb" | "nfc" | "ble" | "internal">;
  }>;
}

export interface WebAuthnLoginOptions {
  challenge: string;
  allowCredentials: Array<{
    id: string;
    type: "public-key";
    transports?: Array<"usb" | "nfc" | "ble" | "internal">;
  }>;
  timeout: number;
  userVerification: "required" | "preferred" | "discouraged";
  rpId: string;
}

export interface RegistrationOptionsReq {
  username: string;
}

export interface RegistrationVerificationReq {
  credential: {
    id: string;
    rawId: string;
    type: string;
    response: {
      clientDataJSON: string;
      attestationObject: string;
    };
  };
  credentialName: string;
}

export interface LoginOptionsReq {
  username: string;
}

export interface LoginVerificationReq {
  credential: AuthenticationResponseJSON;
  username: string;
}

export const useWebAuthnEnabled = () => {
  const result = useQuery({
    queryKey: ["webauthn/enabled"],
    queryFn: () => requestPost<{ enabled: boolean }>("webauthn/enabled"),
  });

  return { ...result, webAuthnEnabled: result.data?.data?.enabled || false };
};

// 获取注册选项
export const useGetRegistrationOptions = () => {
  return useMutation({
    mutationFn: () => {
      return requestPost<WebAuthnRegistrationOptions>(
        "webauthn/registration-options",
      );
    },
  });
};

// 验证注册响应
export const useVerifyRegistration = () => {
  return useMutation({
    mutationFn: (data: RegistrationVerificationReq) => {
      return requestPost<{
        verified: boolean;
        user: { id: string; username: string };
      }>("webauthn/registration-verification", data);
    },
  });
};

// 获取登录选项
export const useGetLoginOptions = () => {
  return useMutation({
    mutationFn: (data: LoginOptionsReq) => {
      return requestPost<WebAuthnLoginOptions>("webauthn/login-options", data);
    },
  });
};

// 验证登录响应
export const useVerifyLogin = () => {
  return useMutation({
    mutationFn: (data: LoginVerificationReq) => {
      return requestPost<{ verified: boolean; token: string }>(
        "webauthn/login-verification",
        data,
      );
    },
  });
};

// 获取用户凭证列表
export const useGetCredentials = () => {
  return useQuery({
    queryKey: ["webauthn/credentials"],
    queryFn: () => requestPost<WebAuthnCredential[]>("webauthn/credentials"),
  });
};

// 删除用户凭证
export const useDeleteCredential = () => {
  return useMutation({
    mutationFn: (credentialId: string) => {
      return requestPost<{ message: string }>(`webauthn/credentials/delete`, {
        credentialId,
      });
    },
  });
};
