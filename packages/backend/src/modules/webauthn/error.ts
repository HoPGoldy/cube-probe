import { ErrorBadRequest } from "@/types/error";

export class ErrorWrongUser extends ErrorBadRequest {
  constructor() {
    super("用户不存在或未注册任何验证器");
    this.code = 40002;
  }
}

export class ErrorChallengeTimeout extends ErrorBadRequest {
  constructor() {
    super("验证码已过期，请刷新页面重试");
    this.code = 40003;
  }
}

export class ErrorVerificationFailed extends ErrorBadRequest {
  constructor() {
    super("验证失败，请重试");
    this.code = 40008;
  }
}

export class ErrorWebAuthnNotEnabled extends ErrorBadRequest {
  constructor() {
    super("WebAuthn 未启用");
    this.code = 40009;
  }
}
