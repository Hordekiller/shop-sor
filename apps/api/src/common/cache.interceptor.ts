import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Request, Response } from "express";

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const publicPaths = [
      "/api/products",
      "/api/categories",
      "/api/slides/active",
      "/api/settings/public",
    ];

    const isPublicGet =
      publicPaths.some((p) => request.path.startsWith(p)) &&
      request.method === "GET";

    if (isPublicGet) {
      response.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
    } else if (request.method === "GET" && !request.path.includes("/auth")) {
      response.setHeader("Cache-Control", "private, no-cache, must-revalidate");
    }

    return next.handle();
  }
}
