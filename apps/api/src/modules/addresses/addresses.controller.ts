import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AddressesService } from "./addresses.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateAddressDto, UpdateAddressDto } from "./dto/address.dto";
import {
  validateMobile,
  validatePostalCode,
  validatePersianName,
  isValidIranLocation,
} from "../../common/iran-validators";

@ApiTags("Addresses")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("addresses")
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: "Get all user addresses" })
  async findAll(@Req() req: any) {
    return this.addressesService.findAll(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: "Create a new address" })
  async create(@Req() req: any, @Body() body: CreateAddressDto) {
    if (!validatePersianName(body.receiverName)) {
      throw new BadRequestException("نام گیرنده باید به فارسی باشد");
    }
    if (!validateMobile(body.phone)) {
      throw new BadRequestException("شماره موبایل نامعتبر است");
    }
    if (!validatePostalCode(body.postalCode)) {
      throw new BadRequestException("کد پستی باید ۱۰ رقم باشد");
    }
    if (!isValidIranLocation(body.province, body.city)) {
      throw new BadRequestException("استان یا شهر نامعتبر است");
    }
    return this.addressesService.create(req.user.id, body);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update an address" })
  async update(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: UpdateAddressDto,
  ) {
    if (body.receiverName && !validatePersianName(body.receiverName)) {
      throw new BadRequestException("نام گیرنده باید به فارسی باشد");
    }
    if (body.phone && !validateMobile(body.phone)) {
      throw new BadRequestException("شماره موبایل نامعتبر است");
    }
    if (body.postalCode && !validatePostalCode(body.postalCode)) {
      throw new BadRequestException("کد پستی باید ۱۰ رقم باشد");
    }
    if (
      body.province &&
      body.city &&
      !isValidIranLocation(body.province, body.city)
    ) {
      throw new BadRequestException("استان یا شهر نامعتبر است");
    }
    return this.addressesService.update(+id, req.user.id, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an address" })
  async remove(@Req() req: any, @Param("id") id: string) {
    return this.addressesService.remove(+id, req.user.id);
  }

  @Put(":id/default")
  @ApiOperation({ summary: "Set address as default" })
  async setDefault(@Req() req: any, @Param("id") id: string) {
    return this.addressesService.setDefault(+id, req.user.id);
  }
}
