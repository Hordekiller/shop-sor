import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { SlidesController } from "./slides.controller";
import { SlidesService } from "./slides.service";

@Module({
  controllers: [SlidesController],
  providers: [SlidesService, PrismaService],
  exports: [SlidesService],
})
export class SlidesModule {}
