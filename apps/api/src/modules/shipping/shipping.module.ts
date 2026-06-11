import { Module } from "@nestjs/common";
import { ShippingController } from "./shipping.controller";
import { ShippingService } from "./shipping.service";

@Module({
  controllers: [ShippingController],
  providers: [ShippingService],
})
export class ShippingModule {}
