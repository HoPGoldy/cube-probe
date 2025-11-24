import { PrismaClient } from "@prisma/client";
import { SchemaServiceCreateType, SchemaServiceUpdateType } from "./schema";

interface ServiceOptions {
  prisma: PrismaClient;
}

export class ProbeService {
  constructor(private options: ServiceOptions) {}

  async createService(data: SchemaServiceCreateType) {
    return await this.options.prisma.service.create({
      data: {
        name: data.name,
        url: data.url,
        headers: data.headers || null,
        cronExpression: data.cronExpression || null,
        enabled: data.enabled ?? true,
      },
    });
  }

  async getServiceById(id: string) {
    return await this.options.prisma.service.findUnique({
      where: { id },
      include: {
        endpoints: true,
      },
    });
  }

  async getAllServices() {
    return await this.options.prisma.service.findMany({
      include: {
        endpoints: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async updateService(data: SchemaServiceUpdateType) {
    const { id, ...updateData } = data;
    return await this.options.prisma.service.update({
      where: { id },
      data: {
        ...updateData,
        headers:
          updateData.headers !== undefined ? updateData.headers : undefined,
      },
    });
  }

  async deleteService(id: string) {
    return await this.options.prisma.service.delete({
      where: { id },
    });
  }
}
