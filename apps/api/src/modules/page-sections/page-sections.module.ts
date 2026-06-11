import { Module } from "@nestjs/common";
import { PageSectionsService } from "./page-sections.service";
import { PageSectionsController } from "./page-sections.controller";

@Module({
  providers: [PageSectionsService],
  controllers: [PageSectionsController],
})
export class PageSectionsModule {}
