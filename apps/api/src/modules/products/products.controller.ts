import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { CreateProductDto, UpdateProductDto } from "./dto/create-product.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Products")
@Controller("products")
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: "List products with pagination and filters" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "take", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "categoryId", required: false })
  @ApiQuery({ name: "minPrice", required: false })
  @ApiQuery({ name: "maxPrice", required: false })
  @ApiQuery({ name: "minRating", required: false })
  @ApiQuery({ name: "inStock", required: false })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "brandId", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "publishStatus", required: false })
  @ApiQuery({ name: "isActive", required: false })
  @ApiQuery({
    name: "sort",
    required: false,
    description:
      "newest, cheapest, expensive, popular, best_selling, top_rated, oldest, price_asc, price_desc",
  })
  @ApiQuery({ name: "hasDiscount", required: false })
  async findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get product by ID" })
  async findOne(@Param("id") id: string) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      return this.productsService.findBySlug(id);
    }
    return this.productsService.findById(numericId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "VENDOR")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create product (admin/vendor)" })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "VENDOR")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update product (admin/vendor)" })
  async update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(Number(id), dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "VENDOR")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete product (admin/vendor)" })
  async remove(@Param("id") id: string) {
    return this.productsService.remove(Number(id));
  }

  @Post("bulk/delete")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Bulk delete products" })
  async bulkDelete(@Body() dto: { ids: number[] }) {
    return this.productsService.bulkDelete(dto.ids);
  }

  @Patch("bulk/update")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Bulk update products" })
  async bulkUpdate(
    @Body()
    dto: {
      ids: number[];
      data: {
        isActive?: boolean;
        publishStatus?: string;
        status?: string;
        categoryId?: number;
      };
    },
  ) {
    return this.productsService.bulkUpdate(dto.ids, dto.data);
  }

  @Post("bulk/price")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Bulk update product prices" })
  async bulkPriceUpdate(
    @Body()
    dto: {
      ids: number[];
      operation: "set" | "percent" | "fixed";
      value: number;
      target: "price" | "salePrice";
    },
  ) {
    return this.productsService.bulkPriceUpdate(
      dto.ids,
      dto.operation,
      dto.value,
      dto.target,
    );
  }

  @Post("bulk/import")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Bulk import products from CSV/JSON" })
  async bulkImport(@Body() dto: { products: any[] }) {
    return this.productsService.bulkImport(dto.products);
  }
}
