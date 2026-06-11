import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { PagesService } from "./pages.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Pages")
@Controller()
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get("pages")
  @ApiOperation({ summary: "Get all pages (admin)" })
  async findAll() {
    return this.pagesService.findAll();
  }

  @Get("pages/active")
  @ApiOperation({ summary: "Get active pages (public)" })
  async findActive() {
    return this.pagesService.findActive();
  }

  @Get("pages/slug/:slug")
  @ApiOperation({ summary: "Get page by slug (public)" })
  async findBySlug(@Param("slug") slug: string) {
    return this.pagesService.findBySlug(slug);
  }

  @Get("pages/preview/:id")
  @ApiOperation({ summary: "Preview page by id (allows drafts)" })
  async findPreview(@Param("id") id: string) {
    return this.pagesService.findPreview(+id);
  }

  @Get("pages/:id")
  @ApiOperation({ summary: "Get page by id" })
  async findOne(@Param("id") id: string) {
    return this.pagesService.findOne(+id);
  }

  @Post("pages")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create page" })
  async create(
    @Body()
    body: {
      title: string;
      slug: string;
      type?: string;
      status?: string;
      content?: string;
      contentJson?: string;
      metaTitle?: string;
      metaDesc?: string;
      isActive?: boolean;
      sortOrder?: number;
      publishAt?: string;
      unpublishAt?: string;
    },
  ) {
    return this.pagesService.create(body);
  }

  @Put("pages/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update page" })
  async update(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    return this.pagesService.update(+id, body, req.user?.id);
  }

  @Delete("pages/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete page" })
  async remove(@Param("id") id: string) {
    return this.pagesService.remove(+id);
  }

  @Get("pages/:id/revisions")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get page revisions" })
  async getRevisions(@Param("id") id: string) {
    return this.pagesService.getRevisions(+id);
  }

  @Post("pages/:id/revisions/:revisionId/restore")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Restore a page revision" })
  async restoreRevision(
    @Param("id") id: string,
    @Param("revisionId") revisionId: string,
    @Req() req: any,
  ) {
    return this.pagesService.restoreRevision(+id, +revisionId);
  }
}
