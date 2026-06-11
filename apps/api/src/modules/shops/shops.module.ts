import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { ShopsController } from "./shops.controller";
import { ShopsService } from "./shops.service";

@Module({
  controllers: [ShopsController],
  providers: [ShopsService, PrismaService],
  exports: [ShopsService],
})
export class ShopsModule {}
