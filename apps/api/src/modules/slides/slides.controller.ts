import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { SlidesService } from "./slides.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Slides")
@Controller("slides")
export class SlidesController {
  constructor(private readonly slidesService: SlidesService) {}

  @Get()
  @ApiOperation({ summary: "Get all slides" })
  async findAll() {
    return this.slidesService.findAll();
  }

  @Get("active")
  @ApiOperation({ summary: "Get active slides (public)" })
  async findActive() {
    return this.slidesService.findActive();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get slide by id" })
  async findOne(@Param("id") id: string) {
    return this.slidesService.findById(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create slide" })
  async create(@Body() body: any) {
    return this.slidesService.create(body);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update slide" })
  async update(@Param("id") id: string, @Body() body: any) {
    return this.slidesService.update(+id, body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete slide" })
  async remove(@Param("id") id: string) {
    return this.slidesService.remove(+id);
  }
}
