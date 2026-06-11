import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

interface ShippingRate {
  id: string;
  name: string;
  description: string;
  estimatedDays: string;
  basePrice: number;
  freeThreshold: number;
}

const SHIPPING_METHODS: ShippingRate[] = [
  {
    id: 'post_pishtaz',
    name: 'پست پیشتاز',
    description: 'ارسال با پست پیشتاز (۲ تا ۴ روز کاری)',
    estimatedDays: '۲-۴ روز',
    basePrice: 150000,
    freeThreshold: 5000000,
  },
  {
    id: 'post_sefareshi',
    name: 'پست سفارشی',
    description: 'ارسال با پست سفارشی (۳ تا ۷ روز کاری)',
    estimatedDays: '۳-۷ روز',
    basePrice: 80000,
    freeThreshold: 5000000,
  },
  {
    id: 'tipax',
    name: 'تیپاکس',
    description: 'ارسال با تیپاکس (۱ تا ۳ روز کاری)',
    estimatedDays: '۱-۳ روز',
    basePrice: 200000,
    freeThreshold: 3000000,
  },
  {
    id: 'mahax',
    name: 'ماهکس',
    description: 'ارسال با ماهکس (۱ تا ۲ روز کاری)',
    estimatedDays: '۱-۲ روز',
    basePrice: 180000,
    freeThreshold: 3000000,
  },
  {
    id: 'snapp_box',
    name: 'اسنپ باکس',
    description: 'ارسال با اسنپ باکس (همان روز)',
    estimatedDays: 'همان روز',
    basePrice: 120000,
    freeThreshold: 2000000,
  },
];

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  @Get('methods')
  @ApiOperation({ summary: 'Get available shipping methods' })
  async getMethods() {
    return SHIPPING_METHODS;
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate shipping cost' })
  async calculate(@Body() body: { method: string; subtotal: number; weight?: number }) {
    const method = SHIPPING_METHODS.find((m) => m.id === body.method);
    if (!method) {
      return { valid: false, cost: 0, error: 'Invalid shipping method' };
    }

    const cost = body.subtotal >= method.freeThreshold ? 0 : method.basePrice;

    if (body.weight) {
      const weightCost = Math.ceil(body.weight / 1000) * 50000;
      return {
        valid: true,
        method: method.id,
        name: method.name,
        baseCost: cost,
        weightCost,
        totalCost: cost + weightCost,
        estimatedDays: method.estimatedDays,
      };
    }

    return {
      valid: true,
      method: method.id,
      name: method.name,
      totalCost: cost,
      estimatedDays: method.estimatedDays,
    };
  }
}
