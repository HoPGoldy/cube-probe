import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "../__mocks__/index";

describe("PrismaMock", () => {
  beforeEach(() => {
    resetPrismaMock();
  });

  describe("基础功能", () => {
    it("应该能够创建 mock 实例", () => {
      expect(prismaMock).toBeDefined();
    });

    it("应该能够 mock findMany 返回值", async () => {
      prismaMock.service.findMany.mockResolvedValue([
        {
          id: "test-1",
          name: "Test Service",
          url: "https://example.com",
          enabled: true,
          intervalTime: 60,
          headers: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          notifyEnabled: false,
          notifyFailureCount: 3,
          notifyCooldownMin: 30,
          notifyChannelIds: [],
        },
      ]);

      const services = await prismaMock.service.findMany();
      expect(services).toHaveLength(1);
      expect(services[0].name).toBe("Test Service");
    });
  });

  describe("Service mock 操作", () => {
    it("应该能够 mock create 返回值", async () => {
      const mockService = {
        id: "test-service-1",
        name: "Test Service",
        url: "https://example.com",
        enabled: true,
        intervalTime: 60,
        headers: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        notifyEnabled: false,
        notifyFailureCount: 3,
        notifyCooldownMin: 30,
        notifyChannelIds: [],
      };

      prismaMock.service.create.mockResolvedValue(mockService);

      const service = await prismaMock.service.create({
        data: {
          id: "test-service-1",
          name: "Test Service",
          url: "https://example.com",
          enabled: true,
        },
      });

      expect(service.id).toBe("test-service-1");
      expect(service.name).toBe("Test Service");
      expect(prismaMock.service.create).toHaveBeenCalledTimes(1);
    });

    it("应该能够 mock findUnique 返回值", async () => {
      prismaMock.service.findUnique.mockResolvedValue({
        id: "test-service-2",
        name: "Test Service 2",
        url: null,
        enabled: true,
        headers: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        notifyEnabled: false,
        notifyFailureCount: 3,
        notifyCooldownMin: 30,
        notifyChannelIds: [],
      });

      const found = await prismaMock.service.findUnique({
        where: { id: "test-service-2" },
      });

      expect(found).not.toBeNull();
      expect(found?.name).toBe("Test Service 2");
      expect(prismaMock.service.findUnique).toHaveBeenCalledWith({
        where: { id: "test-service-2" },
      });
    });
  });

  describe("EndPoint mock 操作", () => {
    it("应该能够 mock EndPoint 创建", async () => {
      const mockEndpoint = {
        id: "test-endpoint-1",
        serviceId: "service-1",
        name: "Test EndPoint",
        url: "/api/health",
        method: "GET",
        enabled: true,
        intervalTime: null,
        headers: null,
        timeout: null,
        bodyContent: null,
        bodyContentType: null,
        type: "CONFIG" as const,
        codeContent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.endPoint.create.mockResolvedValue(mockEndpoint);

      const endpoint = await prismaMock.endPoint.create({
        data: {
          id: "test-endpoint-1",
          serviceId: "service-1",
          name: "Test EndPoint",
          url: "/api/health",
          method: "GET",
        },
      });

      expect(endpoint.id).toBe("test-endpoint-1");
      expect(endpoint.serviceId).toBe("service-1");
    });
  });

  describe("ProbeResult mock 操作", () => {
    it("应该能够 mock ProbeResult 创建", async () => {
      const mockResult = {
        id: 1,
        endPointId: "ep1",
        status: 200,
        responseTime: 150,
        success: true,
        message: "OK",
        createdAt: new Date(),
      };

      prismaMock.probeResult.create.mockResolvedValue(mockResult);

      const result = await prismaMock.probeResult.create({
        data: {
          endPointId: "ep1",
          status: 200,
          responseTime: 150,
          success: true,
          message: "OK",
        },
      });

      expect(result.id).toBeDefined();
      expect(result.status).toBe(200);
      expect(result.success).toBe(true);
    });

    it("应该能够 mock count 聚合查询", async () => {
      prismaMock.probeResult.count.mockResolvedValue(3);

      const count = await prismaMock.probeResult.count({
        where: { endPointId: "ep2" },
      });

      expect(count).toBe(3);
    });

    it("应该能够 mock aggregate 聚合查询", async () => {
      prismaMock.probeResult.aggregate.mockResolvedValue({
        _avg: { responseTime: 150, status: null, id: null },
        _min: { responseTime: 50, status: null, id: null },
        _max: { responseTime: 300, status: null, id: null },
        _count: { _all: 10 },
        _sum: { responseTime: null, status: null, id: null },
      });

      const aggregation = await prismaMock.probeResult.aggregate({
        where: { endPointId: "ep2" },
        _avg: { responseTime: true },
        _min: { responseTime: true },
        _max: { responseTime: true },
      });

      expect(aggregation._avg?.responseTime).toBe(150);
      expect(aggregation._min?.responseTime).toBe(50);
      expect(aggregation._max?.responseTime).toBe(300);
    });
  });

  describe("聚合统计表 mock 操作", () => {
    it("应该能够 mock ProbeHourlyStat 创建", async () => {
      const mockHourlyStat = {
        endPointId: "ep3",
        hourTimestamp: new Date("2025-11-28T10:00:00Z"),
        totalChecks: 60,
        successCount: 58,
        avgResponseTime: 120,
        minResponseTime: 50,
        maxResponseTime: 300,
      };

      prismaMock.probeHourlyStat.create.mockResolvedValue(mockHourlyStat);

      const hourlyStat = await prismaMock.probeHourlyStat.create({
        data: mockHourlyStat,
      });

      expect(hourlyStat.totalChecks).toBe(60);
      expect(hourlyStat.successCount).toBe(58);
    });

    it("应该能够 mock ProbeDailyStat 创建", async () => {
      const mockDailyStat = {
        endPointId: "ep4",
        date: new Date("2025-11-28T00:00:00Z"),
        totalChecks: 1440,
        successCount: 1430,
        uptimePercentage: 99.31,
        avgResponseTime: 125,
        minResponseTime: 45,
        maxResponseTime: 350,
      };

      prismaMock.probeDailyStat.create.mockResolvedValue(mockDailyStat);

      const dailyStat = await prismaMock.probeDailyStat.create({
        data: mockDailyStat,
      });

      expect(dailyStat.totalChecks).toBe(1440);
      expect(dailyStat.uptimePercentage).toBe(99.31);
    });
  });

  describe("Mock 重置", () => {
    it("resetPrismaMock 应该清空所有 mock 状态", async () => {
      prismaMock.service.findMany.mockResolvedValue([
        {
          id: "1",
          name: "Test",
          url: null,
          enabled: true,
          headers: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          notifyEnabled: false,
          notifyFailureCount: 3,
          notifyCooldownMin: 30,
          notifyChannelIds: [],
        },
      ]);

      // 第一次调用
      const first = await prismaMock.service.findMany();
      expect(first).toHaveLength(1);

      // 重置
      resetPrismaMock();

      // 重置后 mock 返回 undefined（默认行为）
      const second = await prismaMock.service.findMany();
      expect(second).toBeUndefined();
    });

    it("每个测试之间 mock 状态应该独立", () => {
      // 这个测试验证 beforeEach 中的 resetPrismaMock 工作正常
      expect(prismaMock.service.create).not.toHaveBeenCalled();
    });
  });

  describe("Mock 验证调用参数", () => {
    it("应该能够验证调用次数", async () => {
      prismaMock.service.create.mockResolvedValue({
        id: "1",
        name: "Test",
        url: null,
        enabled: true,
        headers: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        notifyEnabled: false,
        notifyFailureCount: 3,
        notifyCooldownMin: 30,
        notifyChannelIds: [],
      });

      await prismaMock.service.create({ data: { name: "Test 1" } });
      await prismaMock.service.create({ data: { name: "Test 2" } });

      expect(prismaMock.service.create).toHaveBeenCalledTimes(2);
    });

    it("应该能够验证调用参数", async () => {
      prismaMock.probeResult.deleteMany.mockResolvedValue({ count: 5 });

      await prismaMock.probeResult.deleteMany({
        where: {
          createdAt: { lt: new Date("2025-11-25") },
        },
      });

      expect(prismaMock.probeResult.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: new Date("2025-11-25") },
        },
      });
    });
  });
});
