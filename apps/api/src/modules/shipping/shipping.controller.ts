import { Controller, Get, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ShippingService } from "./shipping.service";

@ApiTags("Shipping")
@Controller("shipping")
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  @Get("methods")
  @ApiOperation({ summary: "Get available shipping methods" })
  async getMethods() {
    return this.shippingService.getMethods();
  }

  @Post("calculate")
  @ApiOperation({ summary: "Calculate shipping cost" })
  async calculate(
    @Body() body: { method: string; subtotal: number; weight?: number },
  ) {
    return this.shippingService.calculate(
      body.method,
      body.subtotal,
      body.weight,
    );
  }
}
