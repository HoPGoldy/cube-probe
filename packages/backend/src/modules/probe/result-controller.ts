import { FastifyReply, FastifyRequest } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import {
  SchemaProbeResultCreate,
  SchemaProbeResultDetail,
  createProbeResultDetailVo,
} from "./schema";
import { ResultService } from "./result-service";

interface ControllerOptions {
  server: any;
  resultService: ResultService;
}

export const registerController = async (options: ControllerOptions) => {
  const { server, resultService } = options;
  // Use TypeBox for request validation
  server.withTypeProvider<TypeBoxTypeProvider>();

  // Create a new probe result
  server.post<{
    Body: typeof SchemaProbeResultCreate;
    Reply: typeof SchemaProbeResultDetail;
  }>(
    "/probe/results",
    {
      schema: {
        description: "Create a new probe result",
        body: SchemaProbeResultCreate,
        response: {
          200: SchemaProbeResultDetail,
        },
      },
    },
    async (
      req: FastifyRequest<{ Body: typeof SchemaProbeResultCreate }>,
      reply: FastifyReply,
    ) => {
      try {
        const result = await resultService.createProbeResult(req.body);
        const vo = createProbeResultDetailVo(result);
        return vo;
      } catch (error) {
        req.log.error(error);
        return reply
          .status(500)
          .send({ error: "Failed to create probe result" });
      }
    },
  );

  // Get probe result by ID
  server.get<{
    Params: { id: string };
    Reply: typeof SchemaProbeResultDetail;
  }>(
    "/probe/results/:id",
    {
      schema: {
        description: "Get probe result by ID",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: SchemaProbeResultDetail,
        },
      },
    },
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const { id } = req.params;
        const result = await resultService.getProbeResultById(id);

        if (!result) {
          return reply.status(404).send({ error: "Probe result not found" });
        }

        const vo = createProbeResultDetailVo(result);
        return vo;
      } catch (error) {
        req.log.error(error);
        return reply.status(500).send({ error: "Failed to get probe result" });
      }
    },
  );

  // Get probe results by endpoint ID
  server.get<{
    Params: { endPointId: string };
    Querystring: { limit?: number };
    Reply: (typeof SchemaProbeResultDetail)[];
  }>(
    "/probe/endpoints/:endPointId/results",
    {
      schema: {
        description: "Get probe results for an endpoint",
        params: {
          type: "object",
          properties: {
            endPointId: { type: "string" },
          },
          required: ["endPointId"],
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 1000 },
          },
        },
        response: {
          200: {
            type: "array",
            items: SchemaProbeResultDetail,
          },
        },
      },
    },
    async (
      req: FastifyRequest<{
        Params: { endPointId: string };
        Querystring: { limit?: number };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const { endPointId } = req.params;
        const { limit } = req.query;
        const results = await resultService.getProbeResultsByEndPointId(
          endPointId,
          limit ? parseInt(limit.toString()) : undefined,
        );
        return results.map((result) => createProbeResultDetailVo(result));
      } catch (error) {
        req.log.error(error);
        return reply
          .status(500)
          .send({ error: "Failed to get probe results for endpoint" });
      }
    },
  );

  // Get probe results by service ID
  server.get<{
    Params: { serviceId: string };
    Querystring: { limit?: number };
    Reply: (typeof SchemaProbeResultDetail)[];
  }>(
    "/probe/services/:serviceId/results",
    {
      schema: {
        description: "Get probe results for a service",
        params: {
          type: "object",
          properties: {
            serviceId: { type: "string" },
          },
          required: ["serviceId"],
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 1000 },
          },
        },
        response: {
          200: {
            type: "array",
            items: SchemaProbeResultDetail,
          },
        },
      },
    },
    async (
      req: FastifyRequest<{
        Params: { serviceId: string };
        Querystring: { limit?: number };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const { serviceId } = req.params;
        const { limit } = req.query;
        const results = await resultService.getProbeResultsByServiceId(
          serviceId,
          limit ? parseInt(limit.toString()) : undefined,
        );
        return results.map((result) => createProbeResultDetailVo(result));
      } catch (error) {
        req.log.error(error);
        return reply
          .status(500)
          .send({ error: "Failed to get probe results for service" });
      }
    },
  );

  // Get all probe results
  server.get<{
    Querystring: { limit?: number };
    Reply: (typeof SchemaProbeResultDetail)[];
  }>(
    "/probe/results",
    {
      schema: {
        description: "Get all probe results",
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 1000 },
          },
        },
        response: {
          200: {
            type: "array",
            items: SchemaProbeResultDetail,
          },
        },
      },
    },
    async (
      req: FastifyRequest<{ Querystring: { limit?: number } }>,
      reply: FastifyReply,
    ) => {
      try {
        const { limit } = req.query;
        const results = await resultService.getAllProbeResults(
          limit ? parseInt(limit.toString()) : undefined,
        );
        return results.map((result) => createProbeResultDetailVo(result));
      } catch (error) {
        req.log.error(error);
        return reply.status(500).send({ error: "Failed to get probe results" });
      }
    },
  );

  // Get latest probe results for dashboard
  server.get<{
    Reply: (typeof SchemaProbeResultDetail)[];
  }>(
    "/probe/dashboard/latest",
    {
      schema: {
        description: "Get latest probe results for dashboard",
        response: {
          200: {
            type: "array",
            items: SchemaProbeResultDetail,
          },
        },
      },
    },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      try {
        // Note: This might need to be updated since raw queries don't return typed results
        // For now, we'll return an empty array, but this should be updated once we have a better solution
        const results = await resultService.getLatestProbeResults();
        // This is a temporary implementation - we'll need to adjust based on how Prisma handles raw queries
        return [];
      } catch (error) {
        _req.log.error(error);
        return reply
          .status(500)
          .send({ error: "Failed to get latest probe results" });
      }
    },
  );

  // Delete a probe result
  server.delete<{
    Params: { id: string };
    Reply: { success: boolean };
  }>(
    "/probe/results/:id",
    {
      schema: {
        description: "Delete a probe result",
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
        await resultService.deleteProbeResult(id);
        return { success: true };
      } catch (error) {
        req.log.error(error);
        return reply
          .status(500)
          .send({ error: "Failed to delete probe result" });
      }
    },
  );
};
