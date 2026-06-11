import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getOrCreate(userId: number) {
    let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({ data: { userId } });
    }
    return wallet;
  }

  async getBalance(userId: number) {
    const wallet = await this.getOrCreate(userId);
    return { balance: wallet.balance };
  }

  async getTransactions(userId: number, page = 1, limit = 20) {
    const wallet = await this.getOrCreate(userId);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async deposit(userId: number, amount: number, description?: string) {
    if (amount <= 0) throw new BadRequestException("Amount must be positive");
    const wallet = await this.getOrCreate(userId);

    // Check for active bonus
    const settings = await this.prisma.shopSettings.findUnique({
      where: { id: "singleton" },
    });
    const now = new Date();
    let bonusAmount = 0;
    if (
      settings?.walletBonusPercent &&
      settings.walletBonusPercent > 0 &&
      (!settings.walletBonusFromDate ||
        new Date(settings.walletBonusFromDate) <= now) &&
      (!settings.walletBonusToDate ||
        new Date(settings.walletBonusToDate) >= now)
    ) {
      bonusAmount = Math.round(amount * (settings.walletBonusPercent / 100));
    }

    const totalAdd = amount + bonusAmount;
    return this.prisma.$transaction(async (tx) => {
      // First update: base deposit
      let updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });
      const balanceAfterDeposit = updated.balance;

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: "DEPOSIT",
          description: description ?? "Deposit",
          balanceAfter: balanceAfterDeposit,
        },
      });

      // Bonus transaction
      if (bonusAmount > 0) {
        updated = await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: bonusAmount } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: bonusAmount,
            type: "BONUS",
            description: `پاداش ${settings!.walletBonusPercent}% — ${bonusAmount.toLocaleString()} تومان`,
            balanceAfter: updated.balance,
          },
        });
      }

      return { amount, bonus: bonusAmount, total: totalAdd };
    });
  }

  async withdraw(userId: number, amount: number, description?: string) {
    if (amount <= 0) throw new BadRequestException("Amount must be positive");
    const wallet = await this.getOrCreate(userId);
    if (wallet.balance.lessThan(amount))
      throw new BadRequestException("Insufficient balance");

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      return tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -amount,
          type: "WITHDRAWAL",
          description: description ?? "Withdrawal",
          balanceAfter: updated.balance,
        },
      });
    });
  }

  async pay(userId: number, amount: number, orderId: number) {
    if (amount <= 0) throw new BadRequestException("Amount must be positive");
    const wallet = await this.getOrCreate(userId);
    if (wallet.balance.lessThan(amount))
      throw new BadRequestException("Insufficient balance");

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      return tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -amount,
          type: "PAYMENT",
          description: `Payment for order #${orderId}`,
          refType: "order",
          refId: orderId,
          balanceAfter: updated.balance,
        },
      });
    });
  }

  async refund(userId: number, amount: number, orderId: number) {
    if (amount <= 0) throw new BadRequestException("Amount must be positive");
    const wallet = await this.getOrCreate(userId);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      return tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: "REFUND",
          description: `Refund for order #${orderId}`,
          refType: "order",
          refId: orderId,
          balanceAfter: updated.balance,
        },
      });
    });
  }

  // Admin: adjust any user's wallet
  async adminAdjust(userId: number, amount: number, description: string) {
    const wallet = await this.getOrCreate(userId);
    if (wallet.balance.plus(amount).lessThan(0))
      throw new BadRequestException("Resulting balance cannot be negative");

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      return tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: "ADMIN_ADJUST",
          description,
          balanceAfter: updated.balance,
        },
      });
    });
  }
}
