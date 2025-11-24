import cron, { type ScheduledTask } from "node-cron";
import axios, { AxiosRequestConfig } from "axios";
import { PrismaClient } from "@prisma/client";
import { ResultService } from "@/modules/monitored-result/service";

interface ServiceOptions {
  prisma: PrismaClient;
  resultService: ResultService;
}

export class CronService {
  private activeTasks: Map<string, ScheduledTask> = new Map();

  constructor(private options: ServiceOptions) {}

  // Function to execute a probe request
  private executeProbe = async (endPointId: string) => {
    try {
      // Get endpoint details
      const endPoint = await this.options.prisma.endPoint.findUnique({
        where: { id: endPointId },
      });

      if (!endPoint || !endPoint.enabled) {
        console.log(
          `Endpoint ${endPointId} not found or disabled, skipping probe`,
        );
        return;
      }

      // Get service details for fallback values
      const service = await this.options.prisma.service.findUnique({
        where: { id: endPoint.serviceId },
      });

      if (!service || !service.enabled) {
        console.log(
          `Service for endpoint ${endPointId} not found or disabled, skipping probe`,
        );
        return;
      }

      // Use endpoint values if available, otherwise fallback to service values
      const url = endPoint.url || service.url;
      if (!url) {
        console.log(`No URL found for endpoint ${endPointId}, skipping probe`);
        return;
      }

      const headers = endPoint.headers || service.headers || {};
      const timeout = endPoint.timeout || 10000; // Default to 10 seconds

      // Prepare request config
      const config: AxiosRequestConfig = {
        method: "GET", // We're only doing GET requests for now, could be extended
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

      // Create probe result in database
      await this.options.resultService.createProbeResult({
        endPointId,
        status: response.status,
        responseTime,
        timestamp: new Date().toISOString(),
        success: true,
        message: "Success",
      });

      console.log(
        `Probe completed for endpoint ${endPointId}: Status ${response.status}, Response time: ${responseTime}ms`,
      );
    } catch (error: any) {
      // Calculate response time even for failed requests
      const endTime = Date.now();
      const startTime = endTime; // Simplified - in real implementation you'd track the actual start time
      const responseTime = 0; // Would need to properly track this in a real implementation

      // Determine error details
      let status = null;
      let message = "Unknown error";

      if (error.response) {
        // Server responded with error status
        status = error.response.status;
        message = error.response.statusText || "Server error";
      } else if (error.request) {
        // Request was made but no response received
        message = "No response received";
      } else {
        // Something else happened
        message = error.message || "Request failed";
      }

      // Create probe result in database for failure
      await this.options.resultService.createProbeResult({
        endPointId,
        status: status ?? undefined,
        responseTime,
        timestamp: new Date().toISOString(),
        success: false,
        message,
      });

      console.log(`Probe failed for endpoint ${endPointId}: ${message}`);
    }
  };

  // Function to start all scheduled probes
  async startProbeScheduler() {
    console.log("Starting probe scheduler...");

    // Get all enabled endpoints
    const endpoints = await this.options.prisma.endPoint.findMany({
      where: { enabled: true },
      include: {
        service: true,
      },
    });

    // Schedule a task for each endpoint
    for (const endpoint of endpoints) {
      // Use endpoint cron expression if available, otherwise use service's
      const cronExpression =
        endpoint.cronExpression || endpoint.service.cronExpression;

      if (cronExpression) {
        // Cancel any existing task for this endpoint
        if (this.activeTasks.has(endpoint.id)) {
          this.activeTasks.get(endpoint.id)?.stop();
          this.activeTasks.delete(endpoint.id);
        }

        // Create and store the new task
        const task = cron.schedule(
          cronExpression,
          () => {
            this.executeProbe(endpoint.id);
          },
          {
            timezone: "Asia/Shanghai", // Set timezone as needed
          },
        );

        this.activeTasks.set(endpoint.id, task);
        console.log(
          `Scheduled probe for endpoint ${endpoint.id} with cron: ${cronExpression}`,
        );
      }
    }

    console.log(`Probe scheduler started with ${this.activeTasks.size} tasks`);
  }

  // Function to stop the scheduler and clear all tasks
  stopProbeScheduler() {
    console.log("Stopping probe scheduler...");
    this.activeTasks.forEach((task, id) => {
      console.log(`Stopping task for endpoint ${id}`);
      task.stop();
    });
    this.activeTasks.clear();
    console.log("Probe scheduler stopped");
  }

  // Function to add a new endpoint to the scheduler
  async addEndpointToScheduler(endPointId: string) {
    // Get endpoint details
    const endpoint = await this.options.prisma.endPoint.findUnique({
      where: { id: endPointId },
      include: {
        service: true,
      },
    });

    if (!endpoint || !endpoint.enabled) {
      return;
    }

    // Use endpoint cron expression if available, otherwise use service's
    const cronExpression =
      endpoint.cronExpression || endpoint.service.cronExpression;

    if (cronExpression) {
      // Cancel any existing task for this endpoint
      if (this.activeTasks.has(endPointId)) {
        this.activeTasks.get(endPointId)?.stop();
      }

      // Create and store the new task
      const task = cron.schedule(
        cronExpression,
        () => {
          this.executeProbe(endPointId);
        },
        {
          timezone: "Asia/Shanghai", // Set timezone as needed
        },
      );

      this.activeTasks.set(endPointId, task);
      console.log(
        `Added/updated probe for endpoint ${endPointId} with cron: ${cronExpression}`,
      );
    }
  }

  // Function to remove an endpoint from the scheduler
  removeEndpointFromScheduler(endPointId: string) {
    if (this.activeTasks.has(endPointId)) {
      this.activeTasks.get(endPointId)?.stop();
      this.activeTasks.delete(endPointId);
      console.log(`Removed probe for endpoint ${endPointId}`);
    }
  }

  // Function to update an endpoint in the scheduler
  async updateEndpointInScheduler(endPointId: string) {
    // First remove the old task
    this.removeEndpointFromScheduler(endPointId);

    // Then add the updated task
    await this.addEndpointToScheduler(endPointId);
  }
}
