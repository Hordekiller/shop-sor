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
import { PopupsService } from "./popups.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Popups")
@Controller("popups")
export class PopupsController {
  constructor(private readonly popupsService: PopupsService) {}

  @Get()
  @ApiOperation({ summary: "Get active popups within date range (public)" })
  async findActive() {
    return this.popupsService.findActive();
  }

  @Get("all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all popups (admin)" })
  async findAll() {
    return this.popupsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get popup by id" })
  async findOne(@Param("id") id: string) {
    return this.popupsService.findById(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create popup" })
  async create(@Body() body: any) {
    return this.popupsService.create(body);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update popup" })
  async update(@Param("id") id: string, @Body() body: any) {
    return this.popupsService.update(+id, body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete popup" })
  async remove(@Param("id") id: string) {
    return this.popupsService.remove(+id);
  }
}
