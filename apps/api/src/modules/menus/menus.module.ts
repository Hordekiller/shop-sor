import { Module } from "@nestjs/common";
import { MenusService } from "./menus.service";
import { MenusController } from "./menus.controller";

@Module({
  providers: [MenusService],
  controllers: [MenusController],
})
export class MenusModule {}
