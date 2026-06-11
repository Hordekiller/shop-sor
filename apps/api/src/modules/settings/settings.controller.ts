import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all public settings' })
  async getAll() {
    return this.settingsService.getAll();
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public settings (no auth)' })
  async getPublic() {
    const all = await this.settingsService.getAll();
    return {
      slides: JSON.parse(all.slides || '[]'),
      sections: JSON.parse(all.sections || '[]'),
      site_name: all.site_name,
      site_description: all.site_description,
    };
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update settings (admin)' })
  async update(@Body() body: Record<string, string>) {
    await this.settingsService.setMany(body);
    return { message: 'Settings updated' };
  }
}
