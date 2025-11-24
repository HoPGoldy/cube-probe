import fastify from "fastify";
import { logger } from "@/lib/logger";
import {
  TypeBoxTypeProvider,
  TypeBoxValidatorCompiler,
} from "@fastify/type-provider-typebox";
import { registerSwagger } from "@/lib/swagger";
import { registerService } from "./build-service";
import { registerFrontendHistory } from "@/lib/frontend-history";
import multipart from "@fastify/multipart";
import fastifyJwt from "@fastify/jwt";
import { ENV_JWT_SECRET } from "@/config/env";

export const buildApp = async () => {
  const server = fastify({
    loggerInstance: logger,
  }).withTypeProvider<TypeBoxTypeProvider>();

  server.setValidatorCompiler(TypeBoxValidatorCompiler);

  await server.register(multipart, {
    limits: {
      fileSize: 512 * 1024 * 1024,
    },
  });

  await server.register(fastifyJwt, {
    secret: ENV_JWT_SECRET,
  });

  await registerSwagger(server);

  await registerService(server);

  await registerFrontendHistory(server);

  return server;
};
