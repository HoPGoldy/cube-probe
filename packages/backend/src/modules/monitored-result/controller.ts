import {
  SchemaProbeResultCreate,
  SchemaProbeResultDetail,
  createProbeResultDetailVo,
} from "./schema";
import { ResultService } from "./service";
import { AppInstance } from "@/types";
import Type from "typebox";

interface ControllerOptions {
  server: AppInstance;
  resultService: ResultService;
}

export const registerController = async (options: ControllerOptions) => {
  const { server, resultService } = options;

  server.post(
    "/probe-result/create",
    {
      schema: {
        description: "Create a new probe result",
        body: SchemaProbeResultCreate,
        response: {
          200: SchemaProbeResultDetail,
        },
      },
    },
    async (req) => {
      const result = await resultService.createProbeResult(req.body);
      const vo = createProbeResultDetailVo(result);
      return vo;
    },
  );

  server.post(
    "/probe-result/get",
    {
      schema: {
        description: "Get probe result by ID",
        body: Type.Object({
          id: Type.String(),
        }),
        response: {
          200: SchemaProbeResultDetail,
        },
      },
    },
    async (req) => {
      const { id } = req.body;
      const result = await resultService.getProbeResultById(id);
      if (!result) {
        throw new Error("Probe result not found");
      }

      const vo = createProbeResultDetailVo(result);
      return vo;
    },
  );

  server.post(
    "/probe-result/list-by-endpoint",
    {
      schema: {
        description: "Get probe results for an endpoint",
        body: Type.Object({
          endPointId: Type.String(),
          limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 1000 })),
        }),
        response: {
          200: Type.Array(SchemaProbeResultDetail),
        },
      },
    },
    async (req) => {
      const { endPointId, limit } = req.body;
      const results = await resultService.getProbeResultsByEndPointId(
        endPointId,
        limit,
      );
      return results.map(createProbeResultDetailVo);
    },
  );

  server.post(
    "/probe-result/list-by-service",
    {
      schema: {
        description: "Get probe results for a service",
        body: Type.Object({
          serviceId: Type.String(),
          limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 1000 })),
        }),
        response: {
          200: Type.Array(SchemaProbeResultDetail),
        },
      },
    },
    async (req) => {
      const { serviceId, limit } = req.body;
      const results = await resultService.getProbeResultsByServiceId(
        serviceId,
        limit,
      );
      return results.map(createProbeResultDetailVo);
    },
  );

  server.post(
    "/probe-result/list",
    {
      schema: {
        description: "Get all probe results",
        body: Type.Optional(
          Type.Object({
            limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 1000 })),
          }),
        ),
        response: {
          200: Type.Array(SchemaProbeResultDetail),
        },
      },
    },
    async (req) => {
      const limit = req.body?.limit;
      const results = await resultService.getAllProbeResults(limit);
      return results.map(createProbeResultDetailVo);
    },
  );

  server.post(
    "/probe-result/latest",
    {
      schema: {
        description: "Get latest probe results for dashboard",
        response: {
          200: Type.Array(SchemaProbeResultDetail),
        },
      },
    },
    async (req) => {
      const results = await resultService.getLatestProbeResults();
      return results.map(createProbeResultDetailVo);
    },
  );

  server.post(
    "/probe-result/delete",
    {
      schema: {
        description: "Delete a probe result",
        body: Type.Object({
          id: Type.String(),
        }),
        response: {
          200: Type.Object({ success: Type.Boolean() }),
        },
      },
    },
    async (req) => {
      const { id } = req.body;
      await resultService.deleteProbeResult(id);
      return { success: true };
    },
  );
};
