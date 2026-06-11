import { Module } from "@nestjs/common";
import { FontsService } from "./fonts.service";
import { FontsController } from "./fonts.controller";

@Module({
  providers: [FontsService],
  controllers: [FontsController],
})
export class FontsModule {}
