import { FastifyReply, FastifyRequest } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import {
  SchemaEndPointCreate,
  SchemaEndPointUpdate,
  SchemaEndPointDetail,
  createEndPointDetailVo,
} from "./schema";
import { EndPointService } from "./endpoint-service";
import { AppInstance } from "@/types";

interface ControllerOptions {
  server: AppInstance;
  endPointService: EndPointService;
}

export const registerController = async (options: ControllerOptions) => {
  const { server, endPointService } = options;

  // Create a new endpoint
  server.post<{
    Body: typeof SchemaEndPointCreate;
    Params: { serviceId: string };
    Reply: typeof SchemaEndPointDetail;
  }>(
    "/probe/services/:serviceId/endpoints",
    {
      schema: {
        description: "Create a new endpoint for a service",
        body: SchemaEndPointCreate,
        params: {
          type: "object",
          properties: {
            serviceId: { type: "string" },
          },
          required: ["serviceId"],
        },
        response: {
          200: SchemaEndPointDetail,
        },
      },
    },
    async (
      req: FastifyRequest<{
        Body: typeof SchemaEndPointCreate;
        Params: { serviceId: string };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        // Override the serviceId from the URL to ensure consistency
        const { serviceId } = req.params;
        const result = await endPointService.createEndPoint({
          ...req.body,
          serviceId,
        });
        const vo = createEndPointDetailVo(result);
        return vo;
      } catch (error) {
        req.log.error(error);
        return reply.status(500).send({ error: "Failed to create endpoint" });
      }
    },
  );

  // Get endpoint by ID
  server.get<{
    Params: { id: string };
    Reply: typeof SchemaEndPointDetail;
  }>(
    "/probe/endpoints/:id",
    {
      schema: {
        description: "Get endpoint by ID",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: SchemaEndPointDetail,
        },
      },
    },
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const { id } = req.params;
        const result = await endPointService.getEndPointById(id);

        if (!result) {
          return reply.status(404).send({ error: "Endpoint not found" });
        }

        const vo = createEndPointDetailVo(result);
        return vo;
      } catch (error) {
        req.log.error(error);
        return reply.status(500).send({ error: "Failed to get endpoint" });
      }
    },
  );

  // Get all endpoints by service ID
  server.get<{
    Params: { serviceId: string };
    Reply: (typeof SchemaEndPointDetail)[];
  }>(
    "/probe/services/:serviceId/endpoints",
    {
      schema: {
        description: "Get all endpoints for a service",
        params: {
          type: "object",
          properties: {
            serviceId: { type: "string" },
          },
          required: ["serviceId"],
        },
        response: {
          200: {
            type: "array",
            items: SchemaEndPointDetail,
          },
        },
      },
    },
    async (
      req: FastifyRequest<{ Params: { serviceId: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const { serviceId } = req.params;
        const results =
          await endPointService.getEndPointsByServiceId(serviceId);
        return results.map((endpoint) => createEndPointDetailVo(endpoint));
      } catch (error) {
        req.log.error(error);
        return reply
          .status(500)
          .send({ error: "Failed to get endpoints for service" });
      }
    },
  );

  // Get all endpoints
  server.get<{
    Reply: (typeof SchemaEndPointDetail)[];
  }>(
    "/probe/endpoints",
    {
      schema: {
        description: "Get all endpoints",
        response: {
          200: {
            type: "array",
            items: SchemaEndPointDetail,
          },
        },
      },
    },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      try {
        const results = await endPointService.getAllEndPoints();
        return results.map((endpoint) => createEndPointDetailVo(endpoint));
      } catch (error) {
        _req.log.error(error);
        return reply.status(500).send({ error: "Failed to get endpoints" });
      }
    },
  );

  // Update an endpoint
  server.put<{
    Body: typeof SchemaEndPointUpdate;
    Params: { id: string };
    Reply: typeof SchemaEndPointDetail;
  }>(
    "/probe/endpoints/:id",
    {
      schema: {
        description: "Update an endpoint",
        body: SchemaEndPointUpdate,
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: SchemaEndPointDetail,
        },
      },
    },
    async (
      req: FastifyRequest<{
        Body: typeof SchemaEndPointUpdate;
        Params: { id: string };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const { id } = req.params;
        const result = await endPointService.updateEndPoint({
          ...req.body,
          id,
        });
        const vo = createEndPointDetailVo(result);
        return vo;
      } catch (error) {
        req.log.error(error);
        return reply.status(500).send({ error: "Failed to update endpoint" });
      }
    },
  );

  // Delete an endpoint
  server.delete<{
    Params: { id: string };
    Reply: { success: boolean };
  }>(
    "/probe/endpoints/:id",
    {
      schema: {
        description: "Delete an endpoint",
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
        await endPointService.deleteEndPoint(id);
        return { success: true };
      } catch (error) {
        req.log.error(error);
        return reply.status(500).send({ error: "Failed to delete endpoint" });
      }
    },
  );
};
