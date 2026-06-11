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
import { RedirectService } from "./redirect.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Redirects")
@Controller("redirects")
export class RedirectController {
  constructor(private redirectService: RedirectService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all redirects" })
  async findAll() {
    return this.redirectService.findAll();
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get redirect by ID" })
  async findOne(@Param("id") id: string) {
    return this.redirectService.findById(Number(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create redirect" })
  async create(@Body() dto: { source: string; target: string; type?: number }) {
    return this.redirectService.create(dto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update redirect" })
  async update(
    @Param("id") id: string,
    @Body()
    dto: {
      source?: string;
      target?: string;
      type?: number;
      isActive?: boolean;
    },
  ) {
    return this.redirectService.update(Number(id), dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete redirect" })
  async remove(@Param("id") id: string) {
    return this.redirectService.remove(Number(id));
  }
}
