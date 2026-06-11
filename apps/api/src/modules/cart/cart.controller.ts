import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from "@nestjs/swagger";
import { CartService } from "./cart.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Cart")
@Controller("cart")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user cart items" })
  async findAll(@Req() req: any) {
    return this.cartService.findAll(req.user.id);
  }

  @Get("count")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get cart item count" })
  async count(@Req() req: any) {
    const total = await this.cartService.count(req.user.id);
    return { total };
  }

  @Post("add")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add item to cart" })
  async add(
    @Req() req: any,
    @Body() body: { productId: number; variantId?: number; quantity?: number },
  ) {
    return this.cartService.add(
      req.user.id,
      body.productId,
      body.variantId,
      body.quantity ?? 1,
    );
  }

  @Post("merge")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Merge guest cart items into user cart on login" })
  @ApiBody({
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          productId: { type: "number" },
          variantId: { type: "number" },
          quantity: { type: "number" },
        },
      },
    },
  })
  async merge(
    @Req() req: any,
    @Body()
    items: { productId: number; variantId?: number; quantity?: number }[],
  ) {
    if (!Array.isArray(items)) return { merged: 0 };
    const results = await Promise.allSettled(
      items.map((item) =>
        this.cartService.add(
          req.user.id,
          item.productId,
          item.variantId,
          item.quantity ?? 1,
        ),
      ),
    );
    const merged = results.filter((r) => r.status === "fulfilled").length;
    return { merged, total: items.length };
  }

  @Put("update")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update item quantity" })
  async update(
    @Req() req: any,
    @Body() body: { productId: number; quantity: number; variantId?: number },
  ) {
    return this.cartService.updateQuantity(
      req.user.id,
      body.productId,
      body.quantity,
      body.variantId,
    );
  }

  @Delete("remove/:productId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove item from cart" })
  async remove(
    @Req() req: any,
    @Param("productId") productId: string,
    @Query("variantId") variantId?: string,
  ) {
    return this.cartService.remove(
      req.user.id,
      +productId,
      variantId ? +variantId : undefined,
    );
  }

  @Delete("clear")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Clear cart" })
  async clear(@Req() req: any) {
    return this.cartService.clear(req.user.id);
  }

  // ─── Save for Later ──────────────────────────────────

  @Post("save-for-later")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Move cart item to saved for later" })
  async saveForLater(
    @Req() req: any,
    @Body() body: { productId: number; variantId?: number },
  ) {
    return this.cartService.saveForLater(
      req.user.id,
      body.productId,
      body.variantId,
    );
  }

  @Get("saved-items")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get saved for later items" })
  async getSavedItems(@Req() req: any) {
    return this.cartService.getSavedItems(req.user.id);
  }

  @Post("move-to-cart")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Move saved item back to cart" })
  async moveToCart(
    @Req() req: any,
    @Body() body: { productId: number; variantId?: number },
  ) {
    return this.cartService.moveToCart(
      req.user.id,
      body.productId,
      body.variantId,
    );
  }
}
