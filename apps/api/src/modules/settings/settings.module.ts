import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";
import { EncryptionService } from "./encryption.service";

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, EncryptionService, PrismaService],
  exports: [SettingsService, EncryptionService],
})
export class SettingsModule {}
