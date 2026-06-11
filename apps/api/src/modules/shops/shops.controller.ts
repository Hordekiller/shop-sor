import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyShop(@Req() req: any) {
    return this.shopsService.getMyShop(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createShop(@Req() req: any, @Body() body: { name: string; slug: string; description?: string }) {
    return this.shopsService.createShop(req.user.id, body);
  }
}
