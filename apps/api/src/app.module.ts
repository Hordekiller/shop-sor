import { Module } from "@nestjs/common";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "./common/config.module";
import { PrismaModule } from "./common/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ProductsModule } from "./modules/products/products.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { ShopsModule } from "./modules/shops/shops.module";
import { CouponsModule } from "./modules/coupons/coupons.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ShippingModule } from "./modules/shipping/shipping.module";
import { AdminModule } from "./modules/admin/admin.module";
import { UploadModule } from "./modules/upload/upload.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { SlidesModule } from "./modules/slides/slides.module";
import { VariantsModule } from "./modules/variants/variants.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { WishlistModule } from "./modules/wishlist/wishlist.module";
import { AddressesModule } from "./modules/addresses/addresses.module";
import { CartModule } from "./modules/cart/cart.module";
import { WalletModule } from "./modules/wallet/wallet.module";
import { PagesModule } from "./modules/pages/pages.module";
import { BrandsModule } from "./modules/brands/brands.module";
import { RedirectModule } from "./modules/redirects/redirect.module";
import { OtpModule } from "./modules/otp/otp.module";
import { BlogModule } from "./modules/blog/blog.module";
import { MenusModule } from "./modules/menus/menus.module";
import { PageSectionsModule } from "./modules/page-sections/page-sections.module";
import { StoriesModule } from "./modules/stories/stories.module";
import { PopupsModule } from "./modules/popups/popups.module";
import { MegaMenuModule } from "./modules/mega-menu/mega-menu.module";
import { FontsModule } from "./modules/fonts/fonts.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { EmailModule } from "./modules/email/email.module";
import { StockAlertsModule } from "./modules/stock-alerts/stock-alerts.module";
import { InvoiceModule } from "./modules/invoices/invoice.module";
import { ReturnsModule } from "./modules/returns/returns.module";
import { NotificationTemplatesModule } from "./modules/notification-templates/notification-templates.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
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
    AdminModule,
    ShippingModule,
    UploadModule,
    SettingsModule,
    SlidesModule,
    VariantsModule,
    InventoryModule,
    WishlistModule,
    AddressesModule,
    CartModule,
    WalletModule,
    PagesModule,
    BrandsModule,
    RedirectModule,
    OtpModule,
    BlogModule,
    MenusModule,
    PageSectionsModule,
    StoriesModule,
    PopupsModule,
    MegaMenuModule,
    FontsModule,
    NotificationsModule,
    EmailModule,
    StockAlertsModule,
    InvoiceModule,
    ReturnsModule,
    NotificationTemplatesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
