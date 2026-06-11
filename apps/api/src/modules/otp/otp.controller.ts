import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { OtpService } from "./otp.service";

class RequestOtpDto {
  phone: string;
}

class VerifyOtpDto {
  phone: string;
  code: string;
}

@ApiTags("OTP")
@Controller("otp")
export class OtpController {
  constructor(private otpService: OtpService) {}

  @Post("request")
  @ApiOperation({ summary: "Request OTP code (mock: always returns 12345)" })
  async request(@Body() dto: RequestOtpDto) {
    return this.otpService.request(dto.phone);
  }

  @Post("verify")
  @ApiOperation({ summary: "Verify OTP code" })
  async verify(@Body() dto: VerifyOtpDto) {
    const ok = await this.otpService.verify(dto.phone, dto.code);
    return { verified: ok };
  }
}
