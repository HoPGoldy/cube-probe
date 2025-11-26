import { PrismaClient } from "@prisma/client";
import { SchemaEndPointCreateType, SchemaEndPointUpdateType } from "./schema";
import { IntervalProbeService } from "@/modules/probe-task/interval-service";

interface ServiceOptions {
  prisma: PrismaClient;
  intervalProbeService: IntervalProbeService;
}

export class EndPointService {
  constructor(private options: ServiceOptions) {}

  async createEndPoint(data: SchemaEndPointCreateType) {
    const endPoint = await this.options.prisma.endPoint.create({
      data: {
        serviceId: data.serviceId,
        name: data.name,
        url: data.url,
        headers: data.headers || null,
        intervalTime: data.intervalTime || null,
        enabled: data.enabled ?? true,
        timeout: data.timeout || null,
      },
    });

    // 如果端点启用，添加到定时任务调度器
    if (endPoint.enabled) {
      await this.options.intervalProbeService.addEndpointToScheduler(
        endPoint.id,
      );
    }

    return endPoint;
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

    // 获取更新前的状态
    const oldEndPoint = await this.options.prisma.endPoint.findUnique({
      where: { id },
    });

    const endPoint = await this.options.prisma.endPoint.update({
      where: { id },
      data: {
        ...updateData,
        headers:
          updateData.headers !== undefined ? updateData.headers : undefined,
      },
    });

    // 处理定时任务调度器的更新
    const wasEnabled = oldEndPoint?.enabled ?? false;
    const isEnabled = endPoint.enabled;

    if (wasEnabled && !isEnabled) {
      // 从启用变为禁用：移除任务
      this.options.intervalProbeService.removeEndpointFromScheduler(id);
    } else if (!wasEnabled && isEnabled) {
      // 从禁用变为启用：添加任务
      await this.options.intervalProbeService.addEndpointToScheduler(id);
    } else if (isEnabled) {
      // 保持启用状态但配置可能变化：更新任务
      await this.options.intervalProbeService.updateEndpointInScheduler(id);
    }

    return endPoint;
  }

  async deleteEndPoint(id: string) {
    // 先从调度器移除任务
    this.options.intervalProbeService.removeEndpointFromScheduler(id);

    // 再删除数据库记录
    return await this.options.prisma.endPoint.delete({
      where: { id },
    });
  }
}
