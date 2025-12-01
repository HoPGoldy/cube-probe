import axios from "axios";
import {
  PrismaClient,
  NotificationRule,
  NotificationChannel,
  NotificationScopeType,
} from "@db/client";
import { renderTemplate, TemplateContext } from "./template";

interface ServiceOptions {
  prisma: PrismaClient;
}

interface EndpointStatus {
  consecutiveFailures: number;
  currentStatus: "UP" | "DOWN";
  lastNotifiedAt: Date | null;
}

interface ProbeResultData {
  endPointId: string;
  success: boolean;
  status?: number | null;
  responseTime?: number | null;
  message?: string | null;
}

type RuleWithChannel = NotificationRule & {
  channel: NotificationChannel;
};

export class NotificationService {
  /** 内存状态：存储每个端点的连续失败次数、当前状态、上次通知时间 */
  private endpointStatus: Map<string, EndpointStatus> = new Map();

  constructor(private options: ServiceOptions) {}

  // ==================== Channel CRUD ====================

  async createChannel(data: {
    name: string;
    webhookUrl: string;
    headers?: any;
    bodyTemplate: string;
    enabled?: boolean;
  }) {
    return await this.options.prisma.notificationChannel.create({
      data: {
        name: data.name,
        webhookUrl: data.webhookUrl,
        headers: data.headers || null,
        bodyTemplate: data.bodyTemplate,
        enabled: data.enabled ?? true,
      },
    });
  }

  async updateChannel(data: {
    id: string;
    name?: string;
    webhookUrl?: string;
    headers?: any;
    bodyTemplate?: string;
    enabled?: boolean;
  }) {
    const { id, ...updateData } = data;
    return await this.options.prisma.notificationChannel.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteChannel(id: string) {
    return await this.options.prisma.notificationChannel.delete({
      where: { id },
    });
  }

  async getChannelById(id: string) {
    return await this.options.prisma.notificationChannel.findUnique({
      where: { id },
    });
  }

  async listChannels() {
    return await this.options.prisma.notificationChannel.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  // ==================== Rule CRUD ====================

  async createRule(data: {
    name: string;
    enabled?: boolean;
    scopeType?: NotificationScopeType;
    hostId?: string | null;
    endpointId?: string | null;
    consecutiveFailures?: number;
    cooldownMinutes?: number;
    notifyOnRecovery?: boolean;
    channelId: string;
  }) {
    return await this.options.prisma.notificationRule.create({
      data: {
        name: data.name,
        enabled: data.enabled ?? true,
        scopeType: data.scopeType || "ALL",
        hostId: data.hostId || null,
        endpointId: data.endpointId || null,
        consecutiveFailures: data.consecutiveFailures ?? 3,
        cooldownMinutes: data.cooldownMinutes ?? 30,
        notifyOnRecovery: data.notifyOnRecovery ?? true,
        channelId: data.channelId,
      },
    });
  }

  async updateRule(data: {
    id: string;
    name?: string;
    enabled?: boolean;
    scopeType?: NotificationScopeType;
    hostId?: string | null;
    endpointId?: string | null;
    consecutiveFailures?: number;
    cooldownMinutes?: number;
    notifyOnRecovery?: boolean;
    channelId?: string;
  }) {
    const { id, ...updateData } = data;
    return await this.options.prisma.notificationRule.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteRule(id: string) {
    return await this.options.prisma.notificationRule.delete({
      where: { id },
    });
  }

  async getRuleById(id: string) {
    return await this.options.prisma.notificationRule.findUnique({
      where: { id },
      include: { channel: true, host: true, endpoint: true },
    });
  }

  async listRules() {
    return await this.options.prisma.notificationRule.findMany({
      orderBy: { createdAt: "desc" },
      include: { channel: true, host: true, endpoint: true },
    });
  }

  // ==================== Log CRUD ====================

  async listLogs(params: {
    ruleId?: string;
    endpointId?: string;
    limit?: number;
  }) {
    const { ruleId, endpointId, limit = 100 } = params;

    const where: any = {};
    if (ruleId) where.ruleId = ruleId;
    if (endpointId) where.endpointId = endpointId;

    return await this.options.prisma.notificationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  // ==================== 核心通知逻辑 ====================

  /**
   * 处理探测结果，检查是否需要触发通知
   */
  async processProbeResult(result: ProbeResultData): Promise<void> {
    const { endPointId, success } = result;

    // 获取或初始化端点状态
    let status = this.endpointStatus.get(endPointId);
    if (!status) {
      status = {
        consecutiveFailures: 0,
        currentStatus: "UP",
        lastNotifiedAt: null,
      };
      this.endpointStatus.set(endPointId, status);
    }

    const previousStatus = status.currentStatus;

    // 更新状态
    if (success) {
      status.consecutiveFailures = 0;
      status.currentStatus = "UP";
    } else {
      status.consecutiveFailures++;
    }

    // 获取端点和服务信息
    const endpoint = await this.options.prisma.endPoint.findUnique({
      where: { id: endPointId },
      include: { service: true },
    });

    if (!endpoint) {
      console.log(`[Notification] Endpoint ${endPointId} not found, skipping`);
      return;
    }

    // 查找匹配的规则
    const rules = await this.findMatchingRules(endPointId, endpoint.serviceId);

    if (rules.length === 0) {
      return;
    }

    // 构建模板上下文
    const context: TemplateContext = {
      eventType: success ? "RECOVERY" : "FAILURE",
      endpoint: {
        id: endpoint.id,
        name: endpoint.name,
        url: endpoint.url,
      },
      service: {
        id: endpoint.service.id,
        name: endpoint.service.name,
        url: endpoint.service.url,
      },
      details: {
        status: result.status ?? null,
        responseTime: result.responseTime ?? null,
        message: result.message ?? null,
        consecutiveFailures: status.consecutiveFailures,
      },
      timestamp: new Date().toISOString(),
    };

    // 检查每条规则
    for (const rule of rules) {
      await this.checkAndNotify(rule, status, previousStatus, context);
    }
  }

  /**
   * 查找匹配指定端点的所有规则
   */
  private async findMatchingRules(
    endpointId: string,
    serviceId: string,
  ): Promise<RuleWithChannel[]> {
    return await this.options.prisma.notificationRule.findMany({
      where: {
        enabled: true,
        OR: [
          { scopeType: "ALL" },
          { scopeType: "HOST", hostId: serviceId },
          { scopeType: "ENDPOINT", endpointId: endpointId },
        ],
      },
      include: { channel: true },
    });
  }

  /**
   * 检查单条规则是否需要触发通知
   */
  private async checkAndNotify(
    rule: RuleWithChannel,
    status: EndpointStatus,
    previousStatus: "UP" | "DOWN",
    context: TemplateContext,
  ): Promise<void> {
    const now = new Date();
    const isCurrentSuccess = status.consecutiveFailures === 0;

    // 场景1：一直正常，无需通知
    if (isCurrentSuccess && previousStatus === "UP") {
      return;
    }

    // 场景2：检测到故障（达到连续失败阈值）
    if (
      status.consecutiveFailures >= rule.consecutiveFailures &&
      previousStatus === "UP"
    ) {
      // 状态从 UP 变为 DOWN
      status.currentStatus = "DOWN";

      // 检查冷却时间
      if (this.isInCooldown(status.lastNotifiedAt, rule.cooldownMinutes)) {
        console.log(
          `[Notification] Rule ${rule.name} is in cooldown, skipping`,
        );
        return;
      }

      // 发送故障通知
      context.eventType = "FAILURE";
      await this.sendNotification(rule, context);
      status.lastNotifiedAt = now;
      return;
    }

    // 场景3：恢复通知
    if (
      status.currentStatus === "UP" &&
      previousStatus === "DOWN" &&
      rule.notifyOnRecovery
    ) {
      context.eventType = "RECOVERY";
      await this.sendNotification(rule, context);
      status.lastNotifiedAt = now;
      return;
    }

    // 场景4：持续故障中，达到新的阈值倍数
    if (
      status.currentStatus === "DOWN" &&
      status.consecutiveFailures > rule.consecutiveFailures &&
      status.consecutiveFailures % rule.consecutiveFailures === 0
    ) {
      // 检查冷却时间
      if (this.isInCooldown(status.lastNotifiedAt, rule.cooldownMinutes)) {
        return;
      }

      context.eventType = "FAILURE";
      await this.sendNotification(rule, context);
      status.lastNotifiedAt = now;
    }
  }

  /**
   * 检查是否在冷却时间内
   */
  private isInCooldown(
    lastNotifiedAt: Date | null,
    cooldownMinutes: number,
  ): boolean {
    if (!lastNotifiedAt) return false;

    const cooldownMs = cooldownMinutes * 60 * 1000;
    const elapsed = Date.now() - lastNotifiedAt.getTime();
    return elapsed < cooldownMs;
  }

  /**
   * 发送通知
   */
  private async sendNotification(
    rule: RuleWithChannel,
    context: TemplateContext,
  ): Promise<void> {
    const channel = rule.channel;

    if (!channel.enabled) {
      console.log(
        `[Notification] Channel ${channel.name} is disabled, skipping`,
      );
      return;
    }

    // 渲染模板
    const body = renderTemplate(channel.bodyTemplate, context);
    const title = `${context.eventType} - ${context.endpoint.name}`;

    let success = false;
    let errorMsg: string | null = null;

    try {
      // 解析请求头
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((channel.headers as Record<string, string>) || {}),
      };

      // 发送 Webhook 请求
      await axios.post(channel.webhookUrl, JSON.parse(body), {
        headers,
        timeout: 10000,
      });

      success = true;
      console.log(
        `[Notification] Sent ${context.eventType} notification for ${context.endpoint.name} via ${channel.name}`,
      );
    } catch (error: any) {
      errorMsg = error.message || "Unknown error";
      console.error(
        `[Notification] Failed to send notification via ${channel.name}: ${errorMsg}`,
      );
    }

    // 记录日志
    await this.options.prisma.notificationLog.create({
      data: {
        ruleId: rule.id,
        endpointId: context.endpoint.id,
        eventType: context.eventType,
        title,
        content: body,
        success,
        errorMsg,
      },
    });
  }

  /**
   * 测试渠道配置
   */
  async testChannel(
    channelId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const channel = await this.getChannelById(channelId);
    if (!channel) {
      return { success: false, error: "Channel not found" };
    }

    // 构建测试上下文
    const context: TemplateContext = {
      eventType: "FAILURE",
      endpoint: {
        id: "test-endpoint-id",
        name: "测试端点",
        url: "/api/health",
      },
      service: {
        id: "test-service-id",
        name: "测试服务",
        url: "https://example.com",
      },
      details: {
        status: 500,
        responseTime: 1234,
        message: "这是一条测试通知",
        consecutiveFailures: 3,
      },
      timestamp: new Date().toISOString(),
    };

    const body = renderTemplate(channel.bodyTemplate, context);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((channel.headers as Record<string, string>) || {}),
      };

      await axios.post(channel.webhookUrl, JSON.parse(body), {
        headers,
        timeout: 10000,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Unknown error" };
    }
  }

  /**
   * 清除指定端点的内存状态（端点被删除时调用）
   */
  clearEndpointStatus(endpointId: string): void {
    this.endpointStatus.delete(endpointId);
  }

  /**
   * 获取端点当前状态（用于调试/监控）
   */
  getEndpointStatus(endpointId: string): EndpointStatus | undefined {
    return this.endpointStatus.get(endpointId);
  }
}
