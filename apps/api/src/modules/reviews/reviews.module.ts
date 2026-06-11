import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import {
  ReviewsController,
  AdminReviewsController,
} from "./reviews.controller";
import { ReviewsService } from "./reviews.service";

@Module({
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewsService, PrismaService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
