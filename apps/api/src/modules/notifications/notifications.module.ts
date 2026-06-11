import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { NotificationQueueService } from "./notification-queue.service";
import { PrismaService } from "../../common/prisma.service";
import { NotificationTemplatesModule } from "../notification-templates/notification-templates.module";

@Module({
  imports: [NotificationTemplatesModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationQueueService, PrismaService],
  exports: [NotificationsService, NotificationQueueService],
})
export class NotificationsModule {}
