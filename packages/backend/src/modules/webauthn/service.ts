import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type GenerateRegistrationOptionsOpts,
  type VerifyRegistrationResponseOpts,
  type GenerateAuthenticationOptionsOpts,
  type VerifyAuthenticationResponseOpts,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import { WebAuthnCredential, User } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { NodeCache } from "@cacheable/node-cache";
import {
  ErrorChallengeTimeout,
  ErrorVerificationFailed,
  ErrorWebAuthnNotEnabled,
  ErrorWrongUser,
} from "./error";
import { AppConfigService } from "@/modules/app-config/service";

interface ServiceOptions {
  prisma: PrismaClient;
  appConfigService: AppConfigService;
}

export class WebAuthnService {
  constructor(private options: ServiceOptions) {}

  private cache = new NodeCache<string>({ stdTTL: 300, checkperiod: 60 });

  async getWebAuthnConfig() {
    const appConfig = await this.options.appConfigService.getAll();
    if (
      !appConfig.WEB_AUTHN_RP_ID ||
      !appConfig.WEB_AUTHN_RP_NAME ||
      !appConfig.WEB_AUTHN_ORIGIN
    ) {
      throw new ErrorWebAuthnNotEnabled();
    }

    return {
      rpId: appConfig.WEB_AUTHN_RP_ID,
      rpName: appConfig.WEB_AUTHN_RP_NAME,
      origin: appConfig.WEB_AUTHN_ORIGIN,
    };
  }

  /**
   * 生成注册选项
   */
  async generateRegistrationOptions(userId: string) {
    const configs = await this.getWebAuthnConfig();

    // 查找用户
    const user = await this.options.prisma.user.findUnique({
      where: { id: userId },
      include: { webAuthnCredentials: true },
    });

    if (!user) {
      throw new ErrorWrongUser();
    }

    // 获取用户的现有凭证ID，以避免重复注册
    const excludeCredentials = user.webAuthnCredentials.map((credential) => ({
      id: credential.credentialID,
      transports: JSON.parse(credential.transports),
    }));

    const options: GenerateRegistrationOptionsOpts = {
      rpName: configs.rpName,
      rpID: configs.rpId,
      userID: new Uint8Array(Buffer.from(user.id, "utf-8")),
      userName: user.username,
      attestationType: "none",
      excludeCredentials,
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
    };

    const registrationOptions = await generateRegistrationOptions(options);
    this.cache.set(
      `webauthn-register-challenge:${userId}`,
      registrationOptions.challenge,
    );

    return registrationOptions;
  }

  /**
   * 验证注册响应
   */
  async verifyRegistrationResponse(
    userId: string,
    credentialName: string,
    response: any,
  ): Promise<{
    verified: boolean;
    user: User;
    credential: WebAuthnCredential;
  }> {
    const configs = await this.getWebAuthnConfig();

    // 获取用户信息
    const user = await this.options.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ErrorWrongUser();
    }

    const expectedChallenge = this.cache.get(
      `webauthn-register-challenge:${userId}`,
    );

    if (!expectedChallenge) {
      throw new ErrorChallengeTimeout();
    }

    const options: VerifyRegistrationResponseOpts = {
      response,
      expectedChallenge,
      expectedOrigin: configs.origin,
      expectedRPID: configs.rpId,
    };

    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse(options);
    } catch (error) {
      throw new ErrorVerificationFailed();
    }

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      throw new ErrorVerificationFailed();
    }

    const {
      id: credentialID,
      publicKey: credentialPublicKey,
      counter,
    } = registrationInfo.credential;

    // 获取 transports 信息
    const transports = response.transports || ["internal"]; // 默认为内部认证器

    // 保存凭证到数据库
    const webAuthnCredential =
      await this.options.prisma.webAuthnCredential.create({
        data: {
          userId: user.id,
          name: credentialName,
          credentialID,
          credentialPublicKey:
            Buffer.from(credentialPublicKey).toString("base64"),
          counter,
          transports: JSON.stringify(transports),
        },
      });

    return { verified, user, credential: webAuthnCredential };
  }

  /**
   * 生成登录选项
   */
  async generateAuthenticationOptions(username: string) {
    const configs = await this.getWebAuthnConfig();

    // 查找用户及其凭证
    const user = await this.options.prisma.user.findUnique({
      where: { username },
      include: { webAuthnCredentials: true },
    });

    if (!user || user.webAuthnCredentials.length === 0) {
      throw new ErrorWrongUser();
    }

    // 获取用户的凭证ID列表
    const allowCredentials = user.webAuthnCredentials.map((credential) => ({
      id: credential.credentialID,
      type: "public-key" as const,
      transports: JSON.parse(credential.transports),
    }));

    const options: GenerateAuthenticationOptionsOpts = {
      rpID: configs.rpId,
      userVerification: "preferred",
      allowCredentials,
      timeout: 60000,
    };

    const authOptions = await generateAuthenticationOptions(options);
    this.cache.set(
      `webauthn-auth-challenge:${username}`,
      authOptions.challenge,
    );

    return authOptions;
  }

  /**
   * 验证登录响应
   */
  async verifyAuthenticationResponse(
    username: string,
    response: any,
  ): Promise<{ verified: boolean; user: User }> {
    const configs = await this.getWebAuthnConfig();

    const { id } = response;

    // 从数据库获取凭证信息
    const credential = await this.options.prisma.webAuthnCredential.findUnique({
      where: { credentialID: id },
      include: { user: true },
    });

    if (
      !credential ||
      !credential.user ||
      credential.user.username !== username
    ) {
      throw new ErrorWrongUser();
    }

    // 注意：在实际应用中，挑战应该从用户会话或缓存中获取
    // 这里仅为演示目的，实际部署时需要正确实现挑战验证
    // 例如：const expectedChallenge = await getChallengeFromSession(sessionId);
    const expectedChallenge = this.cache.get(
      `webauthn-auth-challenge:${username}`,
    );
    if (!expectedChallenge) {
      throw new ErrorChallengeTimeout();
    }

    const options: VerifyAuthenticationResponseOpts = {
      response,
      expectedChallenge,
      expectedOrigin: configs.origin,
      expectedRPID: configs.rpId,
      credential: {
        id: credential.credentialID,
        publicKey: Buffer.from(credential.credentialPublicKey, "base64"),
        counter: credential.counter,
      },
    };

    let verification: VerifiedAuthenticationResponse;
    try {
      verification = await verifyAuthenticationResponse(options);
    } catch (error) {
      throw new ErrorVerificationFailed();
    }

    const { verified, authenticationInfo } = verification;

    if (verified && authenticationInfo) {
      const { newCounter } = authenticationInfo;

      // 更新凭证计数器
      await this.options.prisma.webAuthnCredential.update({
        where: { id: credential.id },
        data: { counter: newCounter },
      });
    }

    return { verified, user: credential.user };
  }

  /**
   * 获取用户的所有凭证
   */
  async getUserCredentials(userId: string) {
    const credentials = await this.options.prisma.webAuthnCredential.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        credentialID: true,
        transports: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 解析 transports 字段
    return credentials.map((credential) => ({
      ...credential,
      transports: JSON.parse(credential.transports),
    }));
  }

  /**
   * 删除用户凭证
   */
  async deleteUserCredential(credentialId: string, userId: string) {
    return this.options.prisma.webAuthnCredential.delete({
      where: {
        id: credentialId,
        userId,
      },
    });
  }
}
