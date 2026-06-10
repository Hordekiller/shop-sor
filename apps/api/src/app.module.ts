import { Module } from '@nestjs/common';
import { ConfigModule } from './common/config.module';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ShopsModule } from './modules/shops/shops.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    ShopsModule,
    CouponsModule,
    ReviewsModule,
    PaymentsModule,
    UploadModule,
  ],
})
export class AppModule {}
