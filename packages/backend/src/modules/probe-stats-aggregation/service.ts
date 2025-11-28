import { PrismaClient } from "@db/client";
import { logger } from "@/lib/logger";
import dayjs from "dayjs";

interface AggregationServiceOptions {
  prisma: PrismaClient;
}

/**
 * 探针统计聚合服务
 * 负责将原始 ProbeResult 数据聚合到小时表和日表
 */
export class ProbeStatsAggregationService {
  private hourlyAggregationInterval: NodeJS.Timeout | null = null;
  private dailyAggregationInterval: NodeJS.Timeout | null = null;

  // 小时聚合：每小时执行一次
  private readonly HOURLY_AGGREGATION_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
  // 日聚合：每天执行一次
  private readonly DAILY_AGGREGATION_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private options: AggregationServiceOptions) {}

  /**
   * 启动聚合调度器
   */
  async startAggregationScheduler() {
    logger.info("Starting probe stats aggregation scheduler");

    // 启动时先执行一次聚合，补齐可能遗漏的数据
    await this.performHourlyAggregation();
    await this.performDailyAggregation();

    // 定时执行小时聚合
    this.hourlyAggregationInterval = setInterval(async () => {
      await this.performHourlyAggregation();
    }, this.HOURLY_AGGREGATION_INTERVAL_MS);

    // 定时执行日聚合
    this.dailyAggregationInterval = setInterval(async () => {
      await this.performDailyAggregation();
    }, this.DAILY_AGGREGATION_INTERVAL_MS);

    logger.info("Aggregation scheduler started");
  }

  /**
   * 停止聚合调度器
   */
  stopAggregationScheduler() {
    if (this.hourlyAggregationInterval) {
      clearInterval(this.hourlyAggregationInterval);
      this.hourlyAggregationInterval = null;
    }
    if (this.dailyAggregationInterval) {
      clearInterval(this.dailyAggregationInterval);
      this.dailyAggregationInterval = null;
    }
    logger.info("Aggregation scheduler stopped");
  }

  /**
   * 执行小时级聚合
   * 聚合上一个完整小时的数据
   */
  async performHourlyAggregation() {
    try {
      // 计算上一个完整小时的时间范围
      const now = dayjs();
      const lastHourStart = now.subtract(1, "hour").startOf("hour");
      const lastHourEnd = lastHourStart.add(1, "hour");

      logger.info(
        `Starting hourly aggregation for ${lastHourStart.format("YYYY-MM-DD HH:00")}`,
      );

      // 获取所有在该小时有数据的 endpoint
      const endpointResults = await this.options.prisma.probeResult.groupBy({
        by: ["endPointId"],
        where: {
          createdAt: {
            gte: lastHourStart.toDate(),
            lt: lastHourEnd.toDate(),
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          responseTime: true,
        },
        _min: {
          responseTime: true,
        },
        _max: {
          responseTime: true,
        },
      });

      let aggregatedCount = 0;

      for (const result of endpointResults) {
        // 获取该 endpoint 在该小时的成功次数
        const successCount = await this.options.prisma.probeResult.count({
          where: {
            endPointId: result.endPointId,
            createdAt: {
              gte: lastHourStart.toDate(),
              lt: lastHourEnd.toDate(),
            },
            success: true,
          },
        });

        // 计算平均响应时间（仅成功的请求）
        const successfulResults =
          await this.options.prisma.probeResult.aggregate({
            where: {
              endPointId: result.endPointId,
              createdAt: {
                gte: lastHourStart.toDate(),
                lt: lastHourEnd.toDate(),
              },
              success: true,
              responseTime: {
                not: null,
              },
            },
            _avg: {
              responseTime: true,
            },
            _min: {
              responseTime: true,
            },
            _max: {
              responseTime: true,
            },
          });

        // 使用 upsert 避免重复插入
        await this.options.prisma.probeHourlyStat.upsert({
          where: {
            endPointId_hourTimestamp: {
              endPointId: result.endPointId,
              hourTimestamp: lastHourStart.toDate(),
            },
          },
          update: {
            totalChecks: result._count.id,
            successCount: successCount,
            avgResponseTime: successfulResults._avg.responseTime
              ? Math.round(successfulResults._avg.responseTime)
              : null,
            minResponseTime: successfulResults._min.responseTime,
            maxResponseTime: successfulResults._max.responseTime,
          },
          create: {
            endPointId: result.endPointId,
            hourTimestamp: lastHourStart.toDate(),
            totalChecks: result._count.id,
            successCount: successCount,
            avgResponseTime: successfulResults._avg.responseTime
              ? Math.round(successfulResults._avg.responseTime)
              : null,
            minResponseTime: successfulResults._min.responseTime,
            maxResponseTime: successfulResults._max.responseTime,
          },
        });

        aggregatedCount++;
      }

      logger.info(
        `Hourly aggregation completed: processed ${aggregatedCount} endpoints for ${lastHourStart.format("YYYY-MM-DD HH:00")}`,
      );

      return aggregatedCount;
    } catch (error) {
      logger.error("Failed to perform hourly aggregation:", error);
      throw error;
    }
  }

  /**
   * 执行日级聚合
   * 从小时表聚合前一天的数据到日表
   */
  async performDailyAggregation() {
    try {
      // 计算前一天的时间范围
      const now = dayjs();
      const yesterdayStart = now.subtract(1, "day").startOf("day");
      const yesterdayEnd = yesterdayStart.add(1, "day");

      logger.info(
        `Starting daily aggregation for ${yesterdayStart.format("YYYY-MM-DD")}`,
      );

      // 从小时表获取前一天所有 endpoint 的聚合数据
      const hourlyStats = await this.options.prisma.probeHourlyStat.groupBy({
        by: ["endPointId"],
        where: {
          hourTimestamp: {
            gte: yesterdayStart.toDate(),
            lt: yesterdayEnd.toDate(),
          },
        },
        _sum: {
          totalChecks: true,
          successCount: true,
        },
        _min: {
          minResponseTime: true,
        },
        _max: {
          maxResponseTime: true,
        },
      });

      let aggregatedCount = 0;

      for (const stat of hourlyStats) {
        // 计算加权平均响应时间
        const hourlyDetails =
          await this.options.prisma.probeHourlyStat.findMany({
            where: {
              endPointId: stat.endPointId,
              hourTimestamp: {
                gte: yesterdayStart.toDate(),
                lt: yesterdayEnd.toDate(),
              },
              avgResponseTime: {
                not: null,
              },
              successCount: {
                gt: 0,
              },
            },
            select: {
              successCount: true,
              avgResponseTime: true,
            },
          });

        // 计算加权平均: SUM(successCount * avgResponseTime) / SUM(successCount)
        let weightedAvgResponseTime: number | null = null;
        if (hourlyDetails.length > 0) {
          const totalSuccessCount = hourlyDetails.reduce(
            (sum, h) => sum + h.successCount,
            0,
          );
          const weightedSum = hourlyDetails.reduce(
            (sum, h) => sum + h.successCount * (h.avgResponseTime || 0),
            0,
          );
          if (totalSuccessCount > 0) {
            weightedAvgResponseTime = Math.round(
              weightedSum / totalSuccessCount,
            );
          }
        }

        const totalChecks = stat._sum.totalChecks || 0;
        const successCount = stat._sum.successCount || 0;

        // 计算在线率
        const uptimePercentage =
          totalChecks > 0
            ? Math.round((successCount / totalChecks) * 10000) / 100
            : null;

        // 使用 upsert 避免重复插入
        await this.options.prisma.probeDailyStat.upsert({
          where: {
            endPointId_date: {
              endPointId: stat.endPointId,
              date: yesterdayStart.toDate(),
            },
          },
          update: {
            totalChecks: totalChecks,
            successCount: successCount,
            uptimePercentage: uptimePercentage,
            avgResponseTime: weightedAvgResponseTime,
            minResponseTime: stat._min.minResponseTime,
            maxResponseTime: stat._max.maxResponseTime,
          },
          create: {
            endPointId: stat.endPointId,
            date: yesterdayStart.toDate(),
            totalChecks: totalChecks,
            successCount: successCount,
            uptimePercentage: uptimePercentage,
            avgResponseTime: weightedAvgResponseTime,
            minResponseTime: stat._min.minResponseTime,
            maxResponseTime: stat._max.maxResponseTime,
          },
        });

        aggregatedCount++;
      }

      logger.info(
        `Daily aggregation completed: processed ${aggregatedCount} endpoints for ${yesterdayStart.format("YYYY-MM-DD")}`,
      );

      return aggregatedCount;
    } catch (error) {
      logger.error("Failed to perform daily aggregation:", error);
      throw error;
    }
  }

  /**
   * 手动触发小时聚合（用于测试或管理操作）
   */
  async triggerManualHourlyAggregation() {
    logger.info("Manual hourly aggregation triggered");
    return await this.performHourlyAggregation();
  }

  /**
   * 手动触发日聚合（用于测试或管理操作）
   */
  async triggerManualDailyAggregation() {
    logger.info("Manual daily aggregation triggered");
    return await this.performDailyAggregation();
  }

  /**
   * 获取聚合统计信息
   */
  async getAggregationStats() {
    const hourlyCount = await this.options.prisma.probeHourlyStat.count();
    const dailyCount = await this.options.prisma.probeDailyStat.count();

    const latestHourly = await this.options.prisma.probeHourlyStat.findFirst({
      orderBy: {
        hourTimestamp: "desc",
      },
      select: {
        hourTimestamp: true,
      },
    });

    const latestDaily = await this.options.prisma.probeDailyStat.findFirst({
      orderBy: {
        date: "desc",
      },
      select: {
        date: true,
      },
    });

    return {
      hourlyRecords: hourlyCount,
      dailyRecords: dailyCount,
      latestHourlyTimestamp: latestHourly?.hourTimestamp,
      latestDailyDate: latestDaily?.date,
    };
  }
}
