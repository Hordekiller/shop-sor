import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { StockAlertsController } from "./stock-alerts.controller";
import { StockAlertsService } from "./stock-alerts.service";

@Module({
  controllers: [StockAlertsController],
  providers: [StockAlertsService, PrismaService],
  exports: [StockAlertsService],
})
export class StockAlertsModule {}
