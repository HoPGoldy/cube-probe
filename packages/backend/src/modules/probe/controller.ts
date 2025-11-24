import { FastifyReply, FastifyRequest } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import {
  SchemaServiceCreate,
  SchemaServiceUpdate,
  SchemaServiceDetail,
  createServiceDetailVo,
} from "./schema";
import { ProbeService } from "./service";
import { AppInstance } from "@/types";

interface ControllerOptions {
  server: AppInstance;
  probeService: ProbeService;
}

export const registerController = async (options: ControllerOptions) => {
  const { server, probeService } = options;

  // Create a new service
  server.post<{
    Body: typeof SchemaServiceCreate;
    Reply: typeof SchemaServiceDetail;
  }>(
    "/probe/services",
    {
      schema: {
        description: "Create a new service",
        body: SchemaServiceCreate,
        response: {
          200: SchemaServiceDetail,
        },
      },
    },
    async (
      req: FastifyRequest<{ Body: typeof SchemaServiceCreate }>,
      reply: FastifyReply,
    ) => {
      try {
        const result = await probeService.createService(req.body);
        const vo = createServiceDetailVo(result);
        return vo;
      } catch (error) {
        req.log.error(error);
        return reply.status(500).send({ error: "Failed to create service" });
      }
    },
  );

  // Get service by ID
  server.get<{
    Params: { id: string };
    Reply: typeof SchemaServiceDetail;
  }>(
    "/probe/services/:id",
    {
      schema: {
        description: "Get service by ID",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: SchemaServiceDetail,
        },
      },
    },
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const { id } = req.params;
        const result = await probeService.getServiceById(id);

        if (!result) {
          return reply.status(404).send({ error: "Service not found" });
        }

        const vo = createServiceDetailVo(result);
        return vo;
      } catch (error) {
        req.log.error(error);
        return reply.status(500).send({ error: "Failed to get service" });
      }
    },
  );

  // Get all services
  server.get<{
    Reply: (typeof SchemaServiceDetail)[];
  }>(
    "/probe/services",
    {
      schema: {
        description: "Get all services",
        response: {
          200: {
            type: "array",
            items: SchemaServiceDetail,
          },
        },
      },
    },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      try {
        const results = await probeService.getAllServices();
        return results.map((service) => createServiceDetailVo(service));
      } catch (error) {
        _req.log.error(error);
        return reply.status(500).send({ error: "Failed to get services" });
      }
    },
  );

  // Update a service
  server.put<{
    Body: typeof SchemaServiceUpdate;
    Reply: typeof SchemaServiceDetail;
  }>(
    "/probe/services/:id",
    {
      schema: {
        description: "Update a service",
        body: SchemaServiceUpdate,
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: SchemaServiceDetail,
        },
      },
    },
    async (
      req: FastifyRequest<{
        Body: typeof SchemaServiceUpdate;
        Params: { id: string };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const { id } = req.params;
        const result = await probeService.updateService({ ...req.body, id });
        const vo = createServiceDetailVo(result);
        return vo;
      } catch (error) {
        req.log.error(error);
        return reply.status(500).send({ error: "Failed to update service" });
      }
    },
  );

  // Delete a service
  server.delete<{
    Params: { id: string };
    Reply: { success: boolean };
  }>(
    "/probe/services/:id",
    {
      schema: {
        description: "Delete a service",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
            },
          },
        },
      },
    },
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const { id } = req.params;
        await probeService.deleteService(id);
        return { success: true };
      } catch (error) {
        req.log.error(error);
        return reply.status(500).send({ error: "Failed to delete service" });
      }
    },
  );
};
