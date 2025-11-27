import { PrismaService } from "@/modules/prisma";
import { registerController as registerUserController } from "@/modules/user/controller";
import { registerController as registerAuthController } from "@/modules/auth/controller";
import { registerController as registerAttachmentController } from "@/modules/attachment/controller";
import { registerController as registerApplicationController } from "@/modules/application/controller";
import { registerController as registerWebAuthnController } from "@/modules/webauthn/controller";
import { registerController as registerAppConfigController } from "@/modules/app-config/controller";
import { registerController as registerMonitoredHostController } from "@/modules/monitored-host/controller";
import { registerController as registerEndPointController } from "@/modules/monitored-endpoint/controller";
import { registerController as registerResultController } from "@/modules/monitored-result/controller";
import { registerController as registerCodeExecutorController } from "@/modules/code-executor/controller";
import { UserService } from "@/modules/user/service";
import { AttachmentService } from "@/modules/attachment/service";
import { ApplicationService } from "@/modules/application/service";
import { WebAuthnService } from "@/modules/webauthn/service";
import { AppConfigService } from "@/modules/app-config/service";
import { MonitoredHostService } from "@/modules/monitored-host/service";
import { EndPointService } from "@/modules/monitored-endpoint/service";
import { ResultService } from "@/modules/monitored-result/service";
import { CodeExecutorService } from "@/modules/code-executor/service";
import { IntervalProbeService } from "@/modules/probe-task/interval-service";
import { ProbeResultCleanupService } from "@/modules/probe-result-cleanup/service";
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

  const monitoredHostService = new MonitoredHostService({ prisma });

  const resultService = new ResultService({
    prisma,
  });

  const intervalProbeService = new IntervalProbeService({
    prisma,
    resultService,
  });

  const probeResultCleanupService = new ProbeResultCleanupService({
    prisma,
  });

  const endPointService = new EndPointService({
    prisma,
    intervalProbeService,
  });

  const codeExecutorService = new CodeExecutorService({
    enableHttp: true, // 启用 HTTP 请求功能
    httpTimeout: 10000, // HTTP 请求超时 10 秒
    // allowedDomains: ['api.example.com', '*.github.com'], // 可选：限制允许的域名
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

    registerMonitoredHostController({
      monitoredHostService,
      server,
    });

    registerEndPointController({
      endPointService,
      server,
    });

    registerResultController({
      resultService,
      server,
    });

    registerCodeExecutorController({
      codeExecutorService,
      server,
    });

    // Start the probe scheduler after controllers are registered
    setImmediate(async () => {
      await intervalProbeService.startProbeScheduler();
      await probeResultCleanupService.startCleanupScheduler();
    });
  };

  await instance.register(appControllerPlugin, {
    prefix: "/api",
  });
};
