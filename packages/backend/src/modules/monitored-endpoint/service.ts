import { PrismaClient } from "@prisma/client";
import { SchemaEndPointCreateType, SchemaEndPointUpdateType } from "./schema";

interface ServiceOptions {
  prisma: PrismaClient;
}

export class EndPointService {
  constructor(private options: ServiceOptions) {}

  async createEndPoint(data: SchemaEndPointCreateType) {
    return await this.options.prisma.endPoint.create({
      data: {
        serviceId: data.serviceId,
        name: data.name,
        url: data.url,
        headers: data.headers || null,
        cronExpression: data.cronExpression || null,
        enabled: data.enabled ?? true,
        timeout: data.timeout || null,
      },
    });
  }

  async getEndPointById(id: string) {
    return await this.options.prisma.endPoint.findUnique({
      where: { id },
    });
  }

  async getEndPointsByServiceId(serviceId: string) {
    return await this.options.prisma.endPoint.findMany({
      where: { serviceId },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getAllEndPoints() {
    return await this.options.prisma.endPoint.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async updateEndPoint(data: SchemaEndPointUpdateType) {
    const { id, ...updateData } = data;
    return await this.options.prisma.endPoint.update({
      where: { id },
      data: {
        ...updateData,
        headers:
          updateData.headers !== undefined ? updateData.headers : undefined,
      },
    });
  }

  async deleteEndPoint(id: string) {
    return await this.options.prisma.endPoint.delete({
      where: { id },
    });
  }
}
