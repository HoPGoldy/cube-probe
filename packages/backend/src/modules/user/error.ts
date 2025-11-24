import { ErrorBadRequest } from "@/types/error";

export class ErrorWrongUser extends ErrorBadRequest {
  constructor() {
    super("无效的用户信息");
    this.code = 40004;
  }
}
