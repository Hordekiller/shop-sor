import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { MenusService } from "./menus.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Menus")
@Controller("menus")
export class MenusController {
  constructor(private menusService: MenusService) {}

  @Get()
  @ApiOperation({ summary: "List all menus with tree items" })
  async findAll() {
    return this.menusService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get menu by ID with tree items" })
  async findOne(@Param("id") id: string) {
    return this.menusService.findOne(Number(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create menu (admin)" })
  async create(
    @Body() dto: { name: string; location?: string; isActive?: boolean },
  ) {
    return this.menusService.create(dto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update menu (admin)" })
  async update(
    @Param("id") id: string,
    @Body() dto: { name?: string; location?: string; isActive?: boolean },
  ) {
    return this.menusService.update(Number(id), dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete menu (admin)" })
  async remove(@Param("id") id: string) {
    return this.menusService.remove(Number(id));
  }

  @Post(":id/items")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add item to menu (admin)" })
  async addItem(
    @Param("id") id: string,
    @Body()
    dto: {
      title: string;
      linkType?: string;
      linkValue?: string;
      parentId?: number | null;
      icon?: string;
      image?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    return this.menusService.addItem(Number(id), dto);
  }

  @Put("items/:itemId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update menu item (admin)" })
  async updateItem(
    @Param("itemId") itemId: string,
    @Body()
    dto: {
      title?: string;
      linkType?: string;
      linkValue?: string;
      parentId?: number | null;
      icon?: string;
      image?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    return this.menusService.updateItem(Number(itemId), dto);
  }

  @Delete("items/:itemId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete menu item (admin)" })
  async removeItem(@Param("itemId") itemId: string) {
    return this.menusService.removeItem(Number(itemId));
  }

  @Put(":id/reorder")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reorder menu items (admin)" })
  async reorderItems(
    @Param("id") id: string,
    @Body()
    dto: {
      items: { id: number; parentId?: number | null; sortOrder: number }[];
    },
  ) {
    return this.menusService.reorderItems(dto.items);
  }
}
