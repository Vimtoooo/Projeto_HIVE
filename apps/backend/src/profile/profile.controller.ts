import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard';
import type { SessionRequest } from '../auth/session.service';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './profile.dto';
@Controller('perfil')
@UseGuards(SessionGuard)
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}
  @Get() get(@Req() req: SessionRequest) {
    return this.profile.get(req.usuarioId);
  }
  @Patch() update(@Req() req: SessionRequest, @Body() body: UpdateProfileDto) {
    return this.profile.update(req.usuarioId, body);
  }
}
