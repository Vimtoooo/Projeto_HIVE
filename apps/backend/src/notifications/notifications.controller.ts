import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard';
import type { SessionRequest } from '../auth/session.service';
import { NotificationsService } from './notifications.service';
import {
  NotificationQueryDto,
  ReadNotificationsDto,
} from './notifications.dto';
@Controller('notificacoes')
@UseGuards(SessionGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}
  @Get() list(@Req() req: SessionRequest, @Query() q: NotificationQueryDto) {
    return this.service.list(req.usuarioId, q);
  }
  @Get('resumo') summary(@Req() req: SessionRequest) {
    return this.service.summary(req.usuarioId);
  }
  @Post('ler-todas') readAll(
    @Req() req: SessionRequest,
    @Body() body: ReadNotificationsDto,
  ) {
    return this.service.readAll(req.usuarioId, body.ateId);
  }
  @Get(':id') detail(
    @Req() req: SessionRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.detail(req.usuarioId, id);
  }
  @Post(':id/lida') read(
    @Req() req: SessionRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.read(req.usuarioId, id);
  }
}
