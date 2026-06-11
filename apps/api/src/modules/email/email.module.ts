import { Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { NotificationTemplatesModule } from "../notification-templates/notification-templates.module";

@Module({
  imports: [NotificationTemplatesModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
