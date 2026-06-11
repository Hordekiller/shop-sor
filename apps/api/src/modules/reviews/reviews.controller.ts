import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { ReviewsService } from "./reviews.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Reviews")
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get("products/:productId/reviews")
  @ApiOperation({ summary: "Get approved reviews for a product" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "expert", required: false })
  async findByProduct(
    @Req() req: any,
    @Param("productId") productId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("expert") expert?: string,
  ) {
    const userId = req.user?.id;
    return this.reviewsService.findByProduct(
      +productId,
      Number(page) || 1,
      Math.min(Number(limit) || 20, 100),
      expert === undefined ? undefined : expert === "true",
      userId,
    );
  }

  @Get("reviews/:id")
  @ApiOperation({ summary: "Get a single review" })
  async findById(@Param("id") id: string) {
    return this.reviewsService.findById(+id);
  }

  @Post("products/:productId/reviews")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a review" })
  async create(
    @Req() req: any,
    @Param("productId") productId: string,
    @Body()
    body: {
      rating: number;
      title?: string;
      comment?: string;
      pros?: string | string[];
      cons?: string | string[];
      orderId?: number;
      media?: string[];
    },
  ) {
    return this.reviewsService.create(req.user.id, {
      ...body,
      productId: +productId,
    });
  }

  @Post("reviews/:id/like")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Like a review" })
  async like(@Req() req: any, @Param("id") id: string) {
    return this.reviewsService.like(req.user.id, +id);
  }

  @Delete("reviews/:id/like")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Unlike a review" })
  async unlike(@Req() req: any, @Param("id") id: string) {
    return this.reviewsService.unlike(req.user.id, +id);
  }
}

@ApiTags("Admin Reviews")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("admin/reviews")
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "List all reviews (admin)" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({
    name: "status",
    required: false,
    description: "approved | pending | all",
  })
  @ApiQuery({ name: "expert", required: false })
  @ApiQuery({ name: "search", required: false })
  async findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("expert") expert?: string,
    @Query("search") search?: string,
  ) {
    return this.reviewsService.findAll({
      page: Number(page),
      limit: Number(limit),
      status,
      isExpert: expert,
      search,
    });
  }

  @Put(":id/approve")
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Approve a review" })
  async approve(@Param("id") id: string) {
    return this.reviewsService.approve(+id);
  }

  @Delete(":id")
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Delete a review" })
  async delete(@Param("id") id: string) {
    return this.reviewsService.delete(+id);
  }
}
