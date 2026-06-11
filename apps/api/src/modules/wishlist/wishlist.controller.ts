import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { WishlistService } from "./wishlist.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Wishlist")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("wishlist")
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: "Get user wishlist" })
  async findAll(@Req() req: any, @Query("page") page?: string) {
    return this.wishlistService.findAll(req.user.id, Number(page) || 1);
  }

  @Post(":productId")
  @ApiOperation({ summary: "Add product to wishlist" })
  async add(@Req() req: any, @Param("productId") productId: string) {
    return this.wishlistService.add(req.user.id, +productId);
  }

  @Delete(":productId")
  @ApiOperation({ summary: "Remove product from wishlist" })
  async remove(@Req() req: any, @Param("productId") productId: string) {
    return this.wishlistService.remove(req.user.id, +productId);
  }

  @Get("check")
  @ApiOperation({ summary: "Check which products are wishlisted" })
  async check(@Req() req: any, @Query("ids") ids: string) {
    const productIds = ids.split(",").map(Number).filter(Boolean);
    const set = await this.wishlistService.isWishlisted(
      req.user.id,
      productIds,
    );
    const result: Record<number, boolean> = {};
    for (const pid of productIds) result[pid] = set.has(pid);
    return result;
  }
}
