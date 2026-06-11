import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  shopName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  shopLogo?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  shopFavicon?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  shopDescription?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  contactAddress?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  socialInstagram?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  socialTelegram?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  socialWhatsapp?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  metaDescription?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  zarinpalMerchant?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  smsProvider?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  smsApiKey?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  orderSmsTemplate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional()
  minOrderAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiPropertyOptional()
  taxPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiPropertyOptional()
  walletBonusPercent?: number;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  walletBonusFromDate?: Date;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  walletBonusToDate?: Date;
}
