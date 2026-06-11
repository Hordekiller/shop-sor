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
import { PageSectionsService } from "./page-sections.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Page Sections")
@Controller("page-sections")
export class PageSectionsController {
  constructor(private pageSectionsService: PageSectionsService) {}

  @Get()
  @ApiOperation({ summary: "List all active page sections with blocks" })
  async findAll() {
    return this.pageSectionsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get page section by ID with blocks" })
  async findOne(@Param("id") id: string) {
    return this.pageSectionsService.findOne(Number(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create page section (admin)" })
  async create(
    @Body()
    dto: {
      type?: string;
      title?: string;
      subtitle?: string;
      sortOrder?: number;
      settings?: string;
      isActive?: boolean;
      blocks?: {
        title?: string;
        subtitle?: string;
        image?: string;
        videoUrl?: string;
        link?: string;
        badge?: string;
        badgeColor?: string;
        sortOrder?: number;
        settings?: string;
      }[];
    },
  ) {
    return this.pageSectionsService.create(dto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update page section (admin)" })
  async update(
    @Param("id") id: string,
    @Body()
    dto: {
      type?: string;
      title?: string;
      subtitle?: string;
      sortOrder?: number;
      settings?: string;
      isActive?: boolean;
      blocks?: {
        id?: number;
        title?: string;
        subtitle?: string;
        image?: string;
        videoUrl?: string;
        link?: string;
        badge?: string;
        badgeColor?: string;
        sortOrder?: number;
        settings?: string;
      }[];
    },
  ) {
    return this.pageSectionsService.update(Number(id), dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete page section (admin)" })
  async remove(@Param("id") id: string) {
    return this.pageSectionsService.remove(Number(id));
  }

  @Put("reorder")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reorder page sections (admin)" })
  async reorder(@Body() dto: { ids: number[] }) {
    return this.pageSectionsService.reorder(dto.ids);
  }
}
