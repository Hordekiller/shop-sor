import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { MegaMenuService } from "./mega-menu.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Mega Menu")
@Controller("mega-menu")
export class MegaMenuController {
  constructor(private megaMenuService: MegaMenuService) {}

  @Get()
  @ApiOperation({ summary: "Get mega menu config with menu tree" })
  async getConfig() {
    return this.megaMenuService.getConfig();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Upsert mega menu config (admin)" })
  async upsertConfig(
    @Body()
    dto: {
      menuId?: number | null;
      showCategories?: boolean;
      showBrands?: boolean;
      tabs?: string;
      sidebarTitle?: string | null;
      sidebarLinks?: string;
      sidebarBanner?: string | null;
      sidebarBannerLink?: string | null;
      sidebarBannerSize?: string | null;
    },
  ) {
    return this.megaMenuService.upsertConfig(dto);
  }

  @Get("categories")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all category configs (admin)" })
  async getAllCategoryConfigs() {
    return this.megaMenuService.getAllCategoryConfigs();
  }

  @Get("categories/:categoryId")
  @ApiOperation({ summary: "Get category mega menu config" })
  async getCategoryConfig(@Param("categoryId") categoryId: string) {
    return this.megaMenuService.getCategoryConfig(Number(categoryId));
  }

  @Put("categories/:categoryId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Upsert category mega menu config (admin)" })
  async upsertCategoryConfig(
    @Param("categoryId") categoryId: string,
    @Body()
    dto: {
      icon?: string;
      iconType?: string;
      sidebarBanner?: string | null;
      sidebarBannerLink?: string | null;
      sidebarLinks?: string;
    },
  ) {
    return this.megaMenuService.upsertCategoryConfig(Number(categoryId), dto);
  }

  @Delete("categories/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete category config (admin)" })
  async deleteCategoryConfig(@Param("id") id: string) {
    return this.megaMenuService.deleteCategoryConfig(Number(id));
  }
}
