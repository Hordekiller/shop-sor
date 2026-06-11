import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { PagesController } from "./pages.controller";
import { PagesService } from "./pages.service";
import { PageSchedulerService } from "./page-scheduler.service";

@Module({
  controllers: [PagesController],
  providers: [PagesService, PageSchedulerService, PrismaService],
  exports: [PagesService],
})
export class PagesModule {}
