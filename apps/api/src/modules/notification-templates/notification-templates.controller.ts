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
import { NotificationTemplatesService } from "./notification-templates.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Notification Templates")
@Controller("notification-templates")
export class NotificationTemplatesController {
  constructor(private readonly service: NotificationTemplatesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all templates (admin)" })
  async findAll() {
    return this.service.findAll();
  }

  @Get(":type")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get template by type" })
  async findByType(@Param("type") type: string) {
    return this.service.findByType(type);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create template (admin)" })
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(":type")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update template (admin)" })
  async update(@Param("type") type: string, @Body() body: any) {
    return this.service.update(type, body);
  }

  @Delete(":type")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete template (admin)" })
  async remove(@Param("type") type: string) {
    return this.service.remove(type);
  }
}
