import axios, { AxiosRequestConfig } from "axios";
import { PrismaClient } from "@prisma/client";
import { ResultService } from "@/modules/monitored-result/service";

interface ServiceOptions {
  prisma: PrismaClient;
  resultService: ResultService;
}

interface IntervalTask {
  intervalId: NodeJS.Timeout;
  intervalSeconds: number;
  lastExecutionTime: number;
}

/**
 * 基于间隔时间的定时任务服务
 * 使用秒为单位的间隔执行定时探测任务
 */
export class IntervalProbeService {
  private activeTasks: Map<string, IntervalTask> = new Map();

  constructor(private options: ServiceOptions) {}

  /**
   * 执行探测请求
   */
  private executeProbe = async (endPointId: string) => {
    try {
      // 获取 endpoint 详情
      const endPoint = await this.options.prisma.endPoint.findUnique({
        where: { id: endPointId },
      });

      if (!endPoint || !endPoint.enabled) {
        console.log(
          `Endpoint ${endPointId} not found or disabled, skipping probe`,
        );
        return;
      }

      // 获取 service 详情用于回退值
      const service = await this.options.prisma.service.findUnique({
        where: { id: endPoint.serviceId },
      });

      if (!service || !service.enabled) {
        console.log(
          `Service for endpoint ${endPointId} not found or disabled, skipping probe`,
        );
        return;
      }

      // 优先使用 endpoint 的值，否则回退到 service 的值
      const url = endPoint.url || service.url;
      if (!url) {
        console.log(`No URL found for endpoint ${endPointId}, skipping probe`);
        return;
      }

      const headers = endPoint.headers || service.headers || {};
      const timeout = endPoint.timeout || 10000; // 默认 10 秒

      // 准备请求配置
      const config: AxiosRequestConfig = {
        method: "GET",
        url,
        headers:
          typeof headers === "object" && headers !== null
            ? (headers as Record<string, string>)
            : {},
        timeout,
      };

      const startTime = Date.now();
      const response = await axios(config);
      const responseTime = Date.now() - startTime;

      // 在数据库中创建探测结果
      await this.options.resultService.createProbeResult({
        endPointId,
        status: response.status,
        responseTime,
        timestamp: new Date().toISOString(),
        success: true,
        message: "Success",
      });

      console.log(
        `[Interval] Probe completed for endpoint ${endPointId}: Status ${response.status}, Response time: ${responseTime}ms`,
      );
    } catch (error: any) {
      // 确定错误详情
      let status = null;
      let message = "Unknown error";

      if (error.response) {
        // 服务器响应了错误状态
        status = error.response.status;
        message = error.response.statusText || "Server error";
      } else if (error.request) {
        // 请求已发出但没有收到响应
        message = "No response received";
      } else {
        // 发生了其他错误
        message = error.message || "Request failed";
      }

      // 在数据库中创建失败的探测结果
      await this.options.resultService.createProbeResult({
        endPointId,
        status: status ?? undefined,
        responseTime: 0,
        timestamp: new Date().toISOString(),
        success: false,
        message,
      });

      console.log(
        `[Interval] Probe failed for endpoint ${endPointId}: ${message}`,
      );
    }
  };

  /**
   * 启动所有已调度的探测
   */
  async startProbeScheduler() {
    console.log("[Interval] Starting interval-based probe scheduler...");

    // 获取所有启用的 endpoints
    const endpoints = await this.options.prisma.endPoint.findMany({
      where: { enabled: true },
      include: {
        service: true,
      },
    });

    // 为每个 endpoint 调度任务
    for (const endpoint of endpoints) {
      // 这里需要一个新字段来存储间隔秒数
      // 暂时使用 timeout 字段转换为秒数作为示例
      // 实际应该在数据库 schema 中添加 intervalSeconds 字段
      const intervalSeconds = this.getIntervalSeconds(endpoint);

      if (intervalSeconds > 0) {
        await this.addEndpointToScheduler(endpoint.id, intervalSeconds);
      }
    }

    console.log(
      `[Interval] Probe scheduler started with ${this.activeTasks.size} tasks`,
    );
  }

  /**
   * 获取 endpoint 的间隔秒数
   * 临时实现：从某个字段推断，实际应该有专门的字段
   */
  private getIntervalSeconds(endpoint: any): number {
    // TODO: 实际应该从 endpoint.intervalSeconds 或 service.intervalSeconds 获取
    // 这里作为示例，假设如果没有 cronExpression，就使用 60 秒间隔
    if (!endpoint.cronExpression) {
      return 60; // 默认 60 秒
    }
    return 0; // 有 cron 表达式就不使用间隔模式
  }

  /**
   * 停止调度器并清除所有任务
   */
  stopProbeScheduler() {
    console.log("[Interval] Stopping probe scheduler...");
    this.activeTasks.forEach((task, id) => {
      console.log(`[Interval] Stopping task for endpoint ${id}`);
      clearInterval(task.intervalId);
    });
    this.activeTasks.clear();
    console.log("[Interval] Probe scheduler stopped");
  }

  /**
   * 添加新 endpoint 到调度器
   * @param endPointId endpoint ID
   * @param intervalSeconds 间隔秒数
   */
  async addEndpointToScheduler(endPointId: string, intervalSeconds: number) {
    // 验证间隔时间
    if (intervalSeconds <= 0) {
      console.log(
        `[Interval] Invalid interval ${intervalSeconds} for endpoint ${endPointId}`,
      );
      return;
    }

    // 获取 endpoint 详情
    const endpoint = await this.options.prisma.endPoint.findUnique({
      where: { id: endPointId },
      include: {
        service: true,
      },
    });

    if (!endpoint || !endpoint.enabled) {
      return;
    }

    // 取消该 endpoint 的现有任务
    if (this.activeTasks.has(endPointId)) {
      clearInterval(this.activeTasks.get(endPointId)!.intervalId);
      this.activeTasks.delete(endPointId);
    }

    // 创建并存储新任务
    const intervalId = setInterval(() => {
      this.executeProbe(endPointId);
      // 更新最后执行时间
      const task = this.activeTasks.get(endPointId);
      if (task) {
        task.lastExecutionTime = Date.now();
      }
    }, intervalSeconds * 1000); // 转换为毫秒

    this.activeTasks.set(endPointId, {
      intervalId,
      intervalSeconds,
      lastExecutionTime: Date.now(),
    });

    console.log(
      `[Interval] Scheduled probe for endpoint ${endPointId} with interval: ${intervalSeconds}s`,
    );

    // 立即执行一次
    await this.executeProbe(endPointId);
  }

  /**
   * 从调度器中移除 endpoint
   */
  removeEndpointFromScheduler(endPointId: string) {
    if (this.activeTasks.has(endPointId)) {
      clearInterval(this.activeTasks.get(endPointId)!.intervalId);
      this.activeTasks.delete(endPointId);
      console.log(`[Interval] Removed probe for endpoint ${endPointId}`);
    }
  }

  /**
   * 更新调度器中的 endpoint
   */
  async updateEndpointInScheduler(endPointId: string, intervalSeconds: number) {
    // 先移除旧任务
    this.removeEndpointFromScheduler(endPointId);

    // 然后添加更新后的任务
    await this.addEndpointToScheduler(endPointId, intervalSeconds);
  }

  /**
   * 获取所有活动任务的状态
   */
  getActiveTasksStatus() {
    const tasks: Array<{
      endPointId: string;
      intervalSeconds: number;
      lastExecutionTime: Date;
      nextExecutionTime: Date;
    }> = [];

    this.activeTasks.forEach((task, endPointId) => {
      const now = Date.now();
      const timeSinceLastExecution = now - task.lastExecutionTime;
      const timeUntilNextExecution =
        task.intervalSeconds * 1000 - timeSinceLastExecution;

      tasks.push({
        endPointId,
        intervalSeconds: task.intervalSeconds,
        lastExecutionTime: new Date(task.lastExecutionTime),
        nextExecutionTime: new Date(now + timeUntilNextExecution),
      });
    });

    return tasks;
  }

  /**
   * 暂停特定 endpoint 的探测
   */
  pauseEndpoint(endPointId: string) {
    const task = this.activeTasks.get(endPointId);
    if (task) {
      clearInterval(task.intervalId);
      console.log(`[Interval] Paused probe for endpoint ${endPointId}`);
    }
  }

  /**
   * 恢复特定 endpoint 的探测
   */
  async resumeEndpoint(endPointId: string) {
    const task = this.activeTasks.get(endPointId);
    if (task) {
      await this.addEndpointToScheduler(endPointId, task.intervalSeconds);
      console.log(`[Interval] Resumed probe for endpoint ${endPointId}`);
    }
  }

  /**
   * 手动触发单次探测
   */
  async triggerManualProbe(endPointId: string) {
    console.log(`[Interval] Manual probe triggered for endpoint ${endPointId}`);
    await this.executeProbe(endPointId);
  }
}
