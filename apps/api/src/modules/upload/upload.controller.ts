import {
  Controller,
  Post,
  Delete,
  Get,
  Put,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiQuery,
} from "@nestjs/swagger";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { existsSync, mkdirSync } from "fs";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UploadService } from "./upload.service";

const UPLOAD_DIR = join(process.cwd(), "uploads");

@ApiTags("Upload")
@Controller("upload")
@ApiBearerAuth()
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "VENDOR")
  @ApiOperation({ summary: "Upload a file (admin)" })
  @ApiConsumes("multipart/form-data")
  @ApiQuery({ name: "sourceType", required: false })
  @ApiQuery({ name: "attachedTo", required: false })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOAD_DIR))
            mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query("sourceType") sourceType?: string,
    @Query("attachedTo") attachedTo?: string,
    @Req() req?: any,
  ) {
    if (!file) throw new BadRequestException("No file uploaded");

    const st = sourceType || "admin";
    this.uploadService.validateFile(file.mimetype, file.size, st);

    const dims = await this.uploadService.getImageDimensions(file.path);
    await this.uploadService.resizeImage(file.path);
    const thumbs = await this.uploadService.generateThumbnails(
      file.path,
      UPLOAD_DIR,
    );

    const record = await this.uploadService.createMediaRecord({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      width: dims?.width,
      height: dims?.height,
      thumbnailUrl: thumbs.thumbnailUrl,
      smallUrl: thumbs.smallUrl,
      mediumUrl: thumbs.mediumUrl,
      largeUrl: thumbs.largeUrl,
      xlargeUrl: thumbs.xlargeUrl,
      sourceType: st,
      uploadedById: req?.user?.id,
      attachedTo,
    });

    return record;
  }

  @Post("user")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Upload a file (user, e.g. for reviews)" })
  @ApiConsumes("multipart/form-data")
  @ApiQuery({ name: "attachedTo", required: false })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOAD_DIR))
            mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          cb(null, "u-" + uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async uploadUserFile(
    @UploadedFile() file: Express.Multer.File,
    @Query("attachedTo") attachedTo?: string,
    @Req() req?: any,
  ) {
    if (!file) throw new BadRequestException("No file uploaded");
    const userId = req?.user?.id;
    if (!userId) throw new BadRequestException("User not authenticated");

    this.uploadService.validateFile(file.mimetype, file.size, "user_review");
    await this.uploadService.checkUserUploadLimit(userId);

    const dims = await this.uploadService.getImageDimensions(file.path);
    await this.uploadService.resizeImage(file.path, 1200);
    const thumbs = await this.uploadService.generateThumbnails(
      file.path,
      UPLOAD_DIR,
    );

    const record = await this.uploadService.createMediaRecord({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      width: dims?.width,
      height: dims?.height,
      thumbnailUrl: thumbs.thumbnailUrl,
      smallUrl: thumbs.smallUrl,
      mediumUrl: thumbs.mediumUrl,
      largeUrl: thumbs.largeUrl,
      xlargeUrl: thumbs.xlargeUrl,
      sourceType: "user_review",
      uploadedById: userId,
      attachedTo,
      isApproved: false,
    });

    return record;
  }

  @Post("multiple")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "VENDOR")
  @ApiOperation({ summary: "Upload multiple files (admin)" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FilesInterceptor("files", 10, {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOAD_DIR))
            mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req?: any,
  ) {
    if (!files || files.length === 0)
      throw new BadRequestException("No files uploaded");
    const results: any[] = [];
    for (const file of files) {
      try {
        this.uploadService.validateFile(file.mimetype, file.size);
        const dims = await this.uploadService.getImageDimensions(file.path);
        await this.uploadService.resizeImage(file.path);
        const thumbs = await this.uploadService.generateThumbnails(
          file.path,
          UPLOAD_DIR,
        );
        const record = await this.uploadService.createMediaRecord({
          url: `/uploads/${file.filename}`,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          width: dims?.width,
          height: dims?.height,
          thumbnailUrl: thumbs.thumbnailUrl,
          smallUrl: thumbs.smallUrl,
          mediumUrl: thumbs.mediumUrl,
          largeUrl: thumbs.largeUrl,
          xlargeUrl: thumbs.xlargeUrl,
          sourceType: "admin",
          uploadedById: req?.user?.id,
        });
        results.push(record);
      } catch (e: any) {
        results.push({ filename: file.filename, error: e.message });
      }
    }
    return results;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "List media files" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "sourceType", required: false })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "isApproved", required: false })
  async listMedia(
    @Query("page") page?: string,
    @Query("sourceType") sourceType?: string,
    @Query("type") type?: string,
    @Query("search") search?: string,
    @Query("isApproved") isApproved?: string,
  ) {
    return this.uploadService.getMediaList({
      page: Number(page) || 1,
      sourceType,
      type,
      search,
      isApproved,
    });
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Get media file detail" })
  async getMediaDetail(@Param("id") id: string) {
    const file = await this.uploadService["prisma"].mediaFile.findUnique({
      where: { id: Number(id) },
      include: { uploader: { select: { id: true, name: true, email: true } } },
    });
    if (!file) throw new BadRequestException("File not found");
    return file;
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Update media file metadata" })
  async updateMedia(
    @Param("id") id: string,
    @Body() body: { alt?: string; caption?: string; isApproved?: boolean },
  ) {
    return this.uploadService.updateMedia(Number(id), body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Delete a media file" })
  async remove(@Param("id") id: string) {
    await this.uploadService.deleteMedia(Number(id));
    return { message: "File deleted" };
  }
}
