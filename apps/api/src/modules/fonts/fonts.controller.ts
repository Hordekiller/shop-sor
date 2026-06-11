import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { FontsService } from "./fonts.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Fonts")
@Controller()
export class FontsController {
  constructor(private readonly fontsService: FontsService) {}

  @Get("fonts")
  @ApiOperation({ summary: "Get all fonts (admin)" })
  async findAll() {
    return this.fontsService.findAll();
  }

  @Get("fonts/active")
  @ApiOperation({ summary: "Get active fonts (public)" })
  async findActive() {
    return this.fontsService.findActive();
  }

  @Get("fonts/default")
  @ApiOperation({ summary: "Get default font" })
  async findDefault() {
    return this.fontsService.findDefault();
  }

  @Get("fonts/css")
  @ApiOperation({ summary: "Get CSS @font-face rules for all active fonts" })
  async getCss(): Promise<{ css: string }> {
    const css = await this.fontsService.getCss();
    return { css };
  }

  @Get("fonts/:id")
  @ApiOperation({ summary: "Get font by id" })
  async findOne(@Param("id") id: string) {
    return this.fontsService.findOne(+id);
  }

  @Post("fonts")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create font" })
  async create(
    @Body()
    body: {
      name: string;
      source: string;
      url?: string;
      mediaId?: number;
      filepath?: string;
      weights?: string;
      subsets?: string;
      isDefault?: boolean;
    },
  ) {
    return this.fontsService.create(body);
  }

  @Put("fonts/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update font" })
  async update(@Param("id") id: string, @Body() body: any) {
    return this.fontsService.update(+id, body);
  }

  @Delete("fonts/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete font" })
  async remove(@Param("id") id: string) {
    return this.fontsService.remove(+id);
  }
}
