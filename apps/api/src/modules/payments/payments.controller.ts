import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Payments")
@Controller("payments")
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get("gateways")
  @ApiOperation({ summary: "Get available payment gateways" })
  async getGateways() {
    return this.paymentsService.getPaymentGateways();
  }

  @Post("request/:orderId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Request payment for an order" })
  async requestPayment(
    @Param("orderId") orderId: string,
    @Body("gateway") gateway: string,
  ) {
    return this.paymentsService.requestPayment(Number(orderId), gateway);
  }

  @Get("verify")
  @ApiOperation({ summary: "Verify payment after gateway redirect" })
  async verify(
    @Query("Authority") authority: string,
    @Query("Status") status: string,
  ) {
    return this.paymentsService.verifyPayment(
      authority,
      status as "OK" | "NOK",
    );
  }
}
