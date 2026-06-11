import { Module, OnModuleInit } from "@nestjs/common";
import { NotificationTemplatesService } from "./notification-templates.service";
import { NotificationTemplatesController } from "./notification-templates.controller";

@Module({
  controllers: [NotificationTemplatesController],
  providers: [NotificationTemplatesService],
  exports: [NotificationTemplatesService],
})
export class NotificationTemplatesModule implements OnModuleInit {
  constructor(private readonly service: NotificationTemplatesService) {}

  async onModuleInit() {
    await this.service.seedDefaults();
  }
}
