import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  async register(
    @Body()
    body: {
      name: string;
      email: string;
      phone?: string;
      password: string;
      addressTitle?: string;
      receiverName?: string;
      province?: string;
      city?: string;
      postalCode?: string;
      addressText?: string;
    },
  ) {
    const {
      addressTitle,
      receiverName,
      province,
      city,
      postalCode,
      addressText,
      ...rest
    } = body;
    const address = receiverName
      ? {
          title: addressTitle,
          receiverName,
          phone: body.phone || "",
          province: province || "",
          city: city || "",
          postalCode: postalCode || "",
          addressText: addressText || "",
        }
      : undefined;
    return this.authService.register({ ...rest, address });
  }

  @Post("login")
  @ApiOperation({ summary: "Login with email and password" })
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post("otp-login")
  @ApiOperation({ summary: "Login with phone and OTP code" })
  async otpLogin(@Body() body: { phone: string; code: string }) {
    return this.authService.otpLogin(body.phone, body.code);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  async me(@Req() req: any) {
    return this.authService.me(req.user.id);
  }

  @Put("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user profile" })
  async updateProfile(
    @Req() req: any,
    @Body()
    body: {
      name?: string;
      phone?: string;
      nationalId?: string;
      birthDate?: string;
      avatar?: string;
    },
  ) {
    return this.authService.updateProfile(req.user.id, body);
  }

  @Put("change-password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change current user password" })
  async changePassword(
    @Req() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
  }
}
