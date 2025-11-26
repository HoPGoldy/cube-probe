import { PrismaService } from "@/modules/prisma";
import { registerController as registerUserController } from "@/modules/user/controller";
import { registerController as registerAuthController } from "@/modules/auth/controller";
import { registerController as registerAttachmentController } from "@/modules/attachment/controller";
import { registerController as registerApplicationController } from "@/modules/application/controller";
import { registerController as registerWebAuthnController } from "@/modules/webauthn/controller";
import { registerController as registerAppConfigController } from "@/modules/app-config/controller";
import { UserService } from "@/modules/user/service";
import { AttachmentService } from "@/modules/attachment/service";
import { ApplicationService } from "@/modules/application/service";
import { WebAuthnService } from "@/modules/webauthn/service";
import { AppConfigService } from "@/modules/app-config/service";
import { registerUnifyResponse } from "@/lib/unify-response";
import type { AppInstance } from "@/types";

/**
 * 组装后端服务的主要业务功能
 * 这里手动进行了依赖注入，先创建 service，然后传递给 controller 使用
 */
export const registerService = async (instance: AppInstance) => {
  const prisma = new PrismaService();

  await prisma.seed();

  const userService = new UserService({
    prisma,
  });

  const attachmentService = new AttachmentService({
    prisma,
  });

  const applicationService = new ApplicationService({
    prisma,
  });

  const appConfigService = new AppConfigService({
    prisma,
  });

  const webAuthnService = new WebAuthnService({
    prisma,
    appConfigService,
  });

  const appControllerPlugin = async (server: AppInstance) => {
    registerUnifyResponse(server);

    registerAuthController({
      userService,
      server,
    });

    registerUserController({
      userService,
      server,
    });

    registerAttachmentController({
      attachmentService,
      server,
    });

    registerApplicationController({
      applicationService,
      appConfigService,
      server,
    });

    registerWebAuthnController({
      webAuthnService,
      server,
    });

    registerAppConfigController({
      appConfigService,
      server,
    });
  };

  await instance.register(appControllerPlugin, {
    prefix: "/api",
  });
};
