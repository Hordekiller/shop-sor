import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { AdminController } from "./admin.controller";
import { AdminSettingsService } from "./admin-settings.service";
import { WalletModule } from "../wallet/wallet.module";
import { SettingsModule } from "../settings/settings.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [WalletModule, SettingsModule, NotificationsModule],
  controllers: [AdminController],
  providers: [AdminSettingsService, PrismaService],
})
export class AdminModule {}
