import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { VariantsController } from "./variants.controller";
import { VariantsService } from "./variants.service";

@Module({
  controllers: [VariantsController],
  providers: [VariantsService, PrismaService],
  exports: [VariantsService],
})
export class VariantsModule {}
