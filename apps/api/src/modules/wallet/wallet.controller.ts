import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { WalletService } from "./wallet.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Wallet")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("wallet")
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get("balance")
  @ApiOperation({ summary: "Get wallet balance" })
  async getBalance(@Req() req: any) {
    return this.walletService.getBalance(req.user.id);
  }

  @Get("transactions")
  @ApiOperation({ summary: "Get wallet transactions" })
  async getTransactions(@Req() req: any, @Query("page") page?: string) {
    return this.walletService.getTransactions(req.user.id, Number(page) || 1);
  }

  @Post("deposit")
  @ApiOperation({ summary: "Deposit to wallet" })
  async deposit(
    @Req() req: any,
    @Body() body: { amount: number; description?: string },
  ) {
    return this.walletService.deposit(
      req.user.id,
      body.amount,
      body.description,
    );
  }

  @Post("withdraw")
  @ApiOperation({ summary: "Withdraw from wallet" })
  async withdraw(
    @Req() req: any,
    @Body() body: { amount: number; description?: string },
  ) {
    return this.walletService.withdraw(
      req.user.id,
      body.amount,
      body.description,
    );
  }
}
