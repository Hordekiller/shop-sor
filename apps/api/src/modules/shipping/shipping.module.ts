import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';

@Module({
  controllers: [ShippingController],
})
export class ShippingModule {}
