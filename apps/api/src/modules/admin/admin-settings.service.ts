import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { EncryptionService } from "../settings/encryption.service";

@Injectable()
export class AdminSettingsService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  private sensitiveFields = ["zarinpalMerchant", "smsApiKey"] as const;

  async get() {
    let settings = await this.prisma.shopSettings.findUnique({
      where: { id: "singleton" },
    });
    if (!settings) {
      settings = await this.prisma.shopSettings.create({
        data: { id: "singleton" },
      });
    }

    const decrypted: Record<string, any> = {};
    for (const field of this.sensitiveFields) {
      decrypted[field] = this.encryption.decrypt((settings as any)[field]);
    }

    return { ...settings, ...decrypted };
  }

  async update(
    data: Partial<{
      shopName: string;
      shopLogo: string;
      shopFavicon: string;
      shopDescription: string;
      contactPhone: string;
      contactEmail: string;
      contactAddress: string;
      socialInstagram: string;
      socialTelegram: string;
      socialWhatsapp: string;
      metaTitle: string;
      metaDescription: string;
      zarinpalMerchant: string;
      smsProvider: string;
      smsApiKey: string;
      orderSmsTemplate: string;
      minOrderAmount: number;
      taxPercent: number;
      walletBonusPercent: number;
      walletBonusFromDate: Date;
      walletBonusToDate: Date;
    }>,
    adminId?: number,
  ) {
    const previous = await this.prisma.shopSettings.findUnique({
      where: { id: "singleton" },
    });

    const encrypted = { ...data };
    if (encrypted.zarinpalMerchant) {
      encrypted.zarinpalMerchant = this.encryption.encrypt(
        encrypted.zarinpalMerchant,
      );
    }
    if (encrypted.smsApiKey) {
      encrypted.smsApiKey = this.encryption.encrypt(encrypted.smsApiKey);
    }

    const result = await this.prisma.shopSettings.upsert({
      where: { id: "singleton" },
      update: encrypted,
      create: { id: "singleton", ...encrypted },
    });

    if (previous && adminId) {
      const changedFields: string[] = [];
      for (const [key, value] of Object.entries(data)) {
        if (JSON.stringify((previous as any)[key]) !== JSON.stringify(value)) {
          changedFields.push(key);
        }
      }

      if (changedFields.length > 0) {
        const existingLog = await this.prisma.siteConfig.findUnique({
          where: { key: "settings_change_log" },
        });
        const log = existingLog ? JSON.parse(existingLog.value) : [];
        log.push({
          timestamp: new Date().toISOString(),
          changedFields,
          adminId,
        });
        await this.prisma.siteConfig.upsert({
          where: { key: "settings_change_log" },
          update: { value: JSON.stringify(log) },
          create: { key: "settings_change_log", value: JSON.stringify(log) },
        });
      }
    }

    return result;
  }
}
