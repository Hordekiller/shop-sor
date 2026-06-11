import { Controller, Get, Param, Req, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { InvoiceService } from "./invoice.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Invoices")
@Controller()
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Get("invoices/:orderId/download")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Download order invoice (PDF) - user" })
  async downloadUserInvoice(
    @Req() req: any,
    @Param("orderId") orderId: string,
    @Res() res: Response,
  ) {
    const pdf = await this.invoiceService.generateInvoice(
      Number(orderId),
      req.user.role === "CUSTOMER" ? req.user.id : undefined,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${orderId}.pdf"`,
    );
    res.setHeader("Content-Length", pdf.length);
    res.end(pdf);
  }

  @Get("admin/invoices/:orderId/download")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Download order invoice (PDF) - admin" })
  async downloadAdminInvoice(
    @Param("orderId") orderId: string,
    @Res() res: Response,
  ) {
    const pdf = await this.invoiceService.generateInvoice(Number(orderId));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${orderId}.pdf"`,
    );
    res.setHeader("Content-Length", pdf.length);
    res.end(pdf);
  }
}
