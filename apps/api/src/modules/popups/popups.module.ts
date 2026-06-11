import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { PopupsController } from "./popups.controller";
import { PopupsService } from "./popups.service";

@Module({
  controllers: [PopupsController],
  providers: [PopupsService, PrismaService],
  exports: [PopupsService],
})
export class PopupsModule {}
