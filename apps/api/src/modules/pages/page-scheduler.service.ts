import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class PageSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(PageSchedulerService.name);
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.logger.log("Page scheduler initialized — checking every 5 minutes");
    this.checkSchedule();
    this.interval = setInterval(() => this.checkSchedule(), 5 * 60 * 1000);
  }

  private async checkSchedule() {
    try {
      const now = new Date();

      const toPublish = await this.prisma.page.updateMany({
        where: {
          isActive: false,
          publishAt: { lte: now },
        },
        data: { isActive: true },
      });

      const toUnpublish = await this.prisma.page.updateMany({
        where: {
          isActive: true,
          unpublishAt: { lte: now },
        },
        data: { isActive: false },
      });

      if (toPublish.count > 0 || toUnpublish.count > 0) {
        this.logger.log(
          `Scheduled: published ${toPublish.count}, unpublished ${toUnpublish.count}`,
        );
      }
    } catch (err) {
      this.logger.error("Page schedule check failed", err);
    }
  }
}
