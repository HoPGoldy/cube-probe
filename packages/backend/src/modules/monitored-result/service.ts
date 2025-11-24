import { PrismaClient } from "@prisma/client";
import { SchemaProbeResultCreateType } from "./schema";

interface ServiceOptions {
  prisma: PrismaClient;
}

export class ResultService {
  constructor(private options: ServiceOptions) {}

  async createProbeResult(data: SchemaProbeResultCreateType) {
    return await this.options.prisma.probeResult.create({
      data: {
        endPointId: data.endPointId,
        status: data.status || null,
        responseTime: data.responseTime || null,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        success: data.success,
        message: data.message || null,
      },
    });
  }

  async getProbeResultById(id: string) {
    return await this.options.prisma.probeResult.findUnique({
      where: { id },
    });
  }

  async getProbeResultsByEndPointId(endPointId: string, limit?: number) {
    return await this.options.prisma.probeResult.findMany({
      where: { endPointId },
      orderBy: {
        timestamp: "desc",
      },
      take: limit || 50, // Default to 50 records
    });
  }

  async getProbeResultsByServiceId(serviceId: string, limit?: number) {
    return await this.options.prisma.probeResult.findMany({
      where: {
        endPoint: {
          serviceId,
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit || 100, // Default to 100 records
    });
  }

  async getAllProbeResults(limit?: number) {
    return await this.options.prisma.probeResult.findMany({
      orderBy: {
        timestamp: "desc",
      },
      take: limit || 100, // Default to 100 records
    });
  }

  async deleteProbeResult(id: string) {
    return await this.options.prisma.probeResult.delete({
      where: { id },
    });
  }

  // Get latest probe results for dashboard
  async getLatestProbeResults() {
    // Get the most recent probe result for each endpoint
    const latestResults = await this.options.prisma.$queryRaw<
      Array<{
        id: string;
        createdAt: Date;
        endPointId: string;
        status: number | null;
        responseTime: number | null;
        timestamp: Date;
        success: boolean;
        message: string | null;
      }>
    >`
      SELECT pr.*
      FROM ProbeResult pr
      INNER JOIN (
        SELECT endPointId, MAX(timestamp) as maxTimestamp
        FROM ProbeResult
        GROUP BY endPointId
      ) groupedpr ON pr.endPointId = groupedpr.endPointId AND pr.timestamp = groupedpr.maxTimestamp
      ORDER BY pr.timestamp DESC
    `;

    return latestResults;
  }
}
