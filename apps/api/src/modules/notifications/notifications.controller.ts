import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { NotificationsService } from "./notifications.service";

@ApiTags("Notifications")
@ApiBearerAuth()
@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "List user notifications" })
  async findAll(
    @Req() req: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.findByUser(
      req.user.id,
      +(page || "1"),
      +(limit || "20"),
    );
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Unread notifications count" })
  async unreadCount(@Req() req: any) {
    const count = await this.service.unreadCount(req.user.id);
    return { count };
  }

  @Put("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  async markAllRead(@Req() req: any) {
    await this.service.markAllAsRead(req.user.id);
    return { success: true };
  }

  @Put(":id/read")
  @ApiOperation({ summary: "Mark notification as read" })
  async markRead(@Param("id") id: string, @Req() req: any) {
    await this.service.markAsRead(+id, req.user.id);
    return { success: true };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete notification" })
  async remove(@Param("id") id: string, @Req() req: any) {
    await this.service.delete(+id, req.user.id);
    return { success: true };
  }
}
