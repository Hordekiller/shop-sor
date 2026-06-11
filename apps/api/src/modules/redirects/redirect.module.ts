import { Module } from "@nestjs/common";
import { RedirectController } from "./redirect.controller";
import { RedirectService } from "./redirect.service";

@Module({
  controllers: [RedirectController],
  providers: [RedirectService],
  exports: [RedirectService],
})
export class RedirectModule {}
