import { Type } from "typebox";
import type { ApplicationService } from "./service";
import {
  createApplicationDetailVo,
  SchemaApplicationCreate,
  SchemaApplicationDetail,
  SchemaApplicationUpdate,
} from "./schema";
import type { AppInstance } from "@/types";
import {
  SchemaCommonListFilter,
  createCommonListSchema,
  createCommonListVo,
} from "@/types/schema";
import { AppConfigService } from "@/modules/app-config/service";

interface RegisterOptions {
  server: AppInstance;
  applicationService: ApplicationService;
  appConfigService: AppConfigService;
}

export const registerController = (options: RegisterOptions) => {
  const { server, applicationService, appConfigService } = options;

  server.post(
    "/application/detail",
    {
      config: {
        disableAuth: true,
      },
      schema: {
        description: "获取应用详情",
        tags: ["application"],
        body: Type.Object({
          id: Type.String(),
        }),
        response: {
          200: Type.Union([
            SchemaApplicationDetail,
            Type.Object({
              registrationMode: Type.Boolean(),
            }),
          ]),
        },
      },
    },
    async (request) => {
      const { id } = request.body;
      const application = await applicationService.findById(id);

      if (!application) {
        const appConfig = await appConfigService.getAll();
        return {
          registrationMode: appConfig.REGISTRATION_MODE_ENABLED === "true",
        };
      }

      return createApplicationDetailVo(application);
    },
  );

  server.post(
    "/application/list",
    {
      config: {
        requireAdmin: true,
      },
      schema: {
        description: "获取应用列表",
        tags: ["application"],
        body: SchemaCommonListFilter,
        response: {
          200: createCommonListSchema(SchemaApplicationDetail),
        },
      },
    },
    async (request) => {
      const { items, total } = await applicationService.findAll(request.body);
      return createCommonListVo(items.map(createApplicationDetailVo), total);
    },
  );

  server.post(
    "/application/create",
    {
      config: {
        requireAdmin: true,
      },
      schema: {
        description: "创建应用",
        tags: ["application"],
        body: SchemaApplicationCreate,
        response: {
          200: SchemaApplicationDetail,
        },
      },
    },
    async (request) => {
      const application = await applicationService.create(request.body);
      return createApplicationDetailVo(application);
    },
  );

  server.post(
    "/application/update",
    {
      config: {
        requireAdmin: true,
      },
      schema: {
        description: "更新应用",
        tags: ["application"],
        body: SchemaApplicationUpdate,
        response: {
          200: SchemaApplicationDetail,
        },
      },
    },
    async (request) => {
      const application = await applicationService.update(request.body);
      return createApplicationDetailVo(application);
    },
  );

  server.post(
    "/application/delete",
    {
      config: {
        requireAdmin: true,
      },
      schema: {
        description: "删除应用",
        tags: ["application"],
        body: Type.Object({
          id: Type.String(),
        }),
      },
    },
    async (request) => {
      const { id } = request.body;
      await applicationService.delete(id);
      return { success: true };
    },
  );
};
