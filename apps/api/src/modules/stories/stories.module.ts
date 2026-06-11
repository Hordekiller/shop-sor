import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { StoriesController } from "./stories.controller";
import { StoriesService } from "./stories.service";

@Module({
  controllers: [StoriesController],
  providers: [StoriesService, PrismaService],
  exports: [StoriesService],
})
export class StoriesModule {}
