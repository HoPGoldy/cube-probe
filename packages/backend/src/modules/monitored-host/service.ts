import { PrismaClient } from "@db/client";
import { SchemaServiceCreateType, SchemaServiceUpdateType } from "./schema";

interface ServiceOptions {
  prisma: PrismaClient;
}

export class MonitoredHostService {
  constructor(private options: ServiceOptions) {}

  async createService(data: SchemaServiceCreateType) {
    return await this.options.prisma.service.create({
      data: {
        name: data.name,
        url: data.url,
        headers: data.headers || null,
        enabled: data.enabled ?? true,
        notifyEnabled: data.notifyEnabled ?? false,
        notifyFailureCount: data.notifyFailureCount ?? 3,
        notifyCooldownMin: data.notifyCooldownMin ?? 30,
        notifyChannelIds: data.notifyChannelIds ?? [],
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
        name: updateData.name,
        url: updateData.url,
        headers:
          updateData.headers !== undefined ? updateData.headers : undefined,
        intervalTime: updateData.intervalTime,
        enabled: updateData.enabled,
        notifyEnabled: updateData.notifyEnabled,
        notifyFailureCount: updateData.notifyFailureCount,
        notifyCooldownMin: updateData.notifyCooldownMin,
        notifyChannelIds: updateData.notifyChannelIds,
      },
    });
  }

  async deleteService(id: string) {
    return await this.options.prisma.service.delete({
      where: { id },
    });
  }
}
