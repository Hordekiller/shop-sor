import { Module } from "@nestjs/common";
import { MegaMenuService } from "./mega-menu.service";
import { MegaMenuController } from "./mega-menu.controller";

@Module({
  providers: [MegaMenuService],
  controllers: [MegaMenuController],
})
export class MegaMenuModule {}
