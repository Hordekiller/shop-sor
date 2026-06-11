import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { BlogService } from "./blog.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Blog")
@Controller("blog")
export class BlogController {
  constructor(private blog: BlogService) {}

  // ─── Posts ─────────────────────────────────────────

  @Get("posts")
  @ApiOperation({ summary: "List blog posts (public: only published)" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "categoryId", required: false })
  @ApiQuery({ name: "tagId", required: false })
  @ApiQuery({ name: "search", required: false })
  async listPosts(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("categoryId") categoryId?: string,
    @Query("tagId") tagId?: string,
    @Query("search") search?: string,
  ) {
    return this.blog.getPosts({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status: "published",
      categoryId: categoryId ? Number(categoryId) : undefined,
      tagId: tagId ? Number(tagId) : undefined,
      search,
    });
  }

  @Get("admin/posts")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all blog posts (admin)" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "categoryId", required: false })
  @ApiQuery({ name: "search", required: false })
  async listAdminPosts(
    @Query("page") page?: string,
    @Query("status") status?: string,
    @Query("categoryId") categoryId?: string,
    @Query("search") search?: string,
  ) {
    return this.blog.getPosts({
      page: Number(page) || 1,
      status,
      categoryId: categoryId ? Number(categoryId) : undefined,
      search,
    });
  }

  @Get("posts/:slug")
  @ApiOperation({ summary: "Get post by slug (public)" })
  async getPostBySlug(@Param("slug") slug: string) {
    return this.blog.getPostBySlug(slug);
  }

  @Get("admin/posts/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get post by id (admin)" })
  async getPostById(@Param("id") id: string) {
    return this.blog.getPost(Number(id));
  }

  @Post("admin/posts")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a blog post" })
  async createPost(@Body() body: any, @Req() req: any) {
    return this.blog.createPost({ ...body, authorId: req.user.id });
  }

  @Put("admin/posts/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a blog post" })
  async updatePost(@Param("id") id: string, @Body() body: any) {
    return this.blog.updatePost(Number(id), body);
  }

  @Delete("admin/posts/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a blog post" })
  async deletePost(@Param("id") id: string) {
    return this.blog.deletePost(Number(id));
  }

  // ─── Categories ────────────────────────────────────

  @Get("categories")
  @ApiOperation({ summary: "Get all blog categories (public)" })
  async getCategories() {
    return this.blog.getCategories();
  }

  @Post("admin/categories")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create blog category" })
  async createCategory(@Body() body: any) {
    return this.blog.createCategory(body);
  }

  @Put("admin/categories/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update blog category" })
  async updateCategory(@Param("id") id: string, @Body() body: any) {
    return this.blog.updateCategory(Number(id), body);
  }

  @Delete("admin/categories/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete blog category" })
  async deleteCategory(@Param("id") id: string) {
    return this.blog.deleteCategory(Number(id));
  }

  // ─── Tags ──────────────────────────────────────────

  @Get("tags")
  @ApiOperation({ summary: "Get all blog tags (public)" })
  async getTags() {
    return this.blog.getTags();
  }

  @Post("admin/tags")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create blog tag" })
  async createTag(@Body() body: any) {
    return this.blog.createTag(body);
  }

  @Delete("admin/tags/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete blog tag" })
  async deleteTag(@Param("id") id: string) {
    return this.blog.deleteTag(Number(id));
  }

  // ─── Comments ──────────────────────────────────────

  @Post("comments")
  @ApiOperation({ summary: "Submit a comment (public)" })
  async createComment(@Body() body: any, @Req() req: any) {
    return this.blog.createComment({
      ...body,
      userId: req.user?.id || null,
    });
  }

  @Get("posts/:slug/comments")
  @ApiOperation({ summary: "Get approved comments for a post (public)" })
  async getPostComments(@Param("slug") slug: string) {
    const post = await this.blog.getPostBySlug(slug);
    return this.blog.getComments({ postId: post.id, isApproved: "approved" });
  }

  @Get("admin/comments")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all comments (admin)" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "isApproved", required: false })
  async listComments(
    @Query("page") page?: string,
    @Query("isApproved") isApproved?: string,
  ) {
    return this.blog.getComments({
      page: Number(page) || 1,
      isApproved,
    });
  }

  @Put("admin/comments/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Approve/reject comment" })
  async approveComment(
    @Param("id") id: string,
    @Body("isApproved") isApproved: boolean,
  ) {
    return this.blog.approveComment(Number(id), isApproved);
  }

  @Delete("admin/comments/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete comment" })
  async deleteComment(@Param("id") id: string) {
    return this.blog.deleteComment(Number(id));
  }
}
