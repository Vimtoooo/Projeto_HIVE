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
import { MessagingService } from './messaging.service';
import {
  MessagePageDto,
  SendMessageDto,
  StartConversationDto,
} from './messaging.dto';
@Controller()
@UseGuards(SessionGuard)
export class MessagingController {
  constructor(private readonly service: MessagingService) {}
  @Get('conversas') list(@Req() req: SessionRequest) {
    return this.service.list(req.usuarioId);
  }
  @Post('conversas') start(
    @Req() req: SessionRequest,
    @Body() body: StartConversationDto,
  ) {
    return this.service.start(req.usuarioId, body.prestadorId);
  }
  @Get('conversas/:id/mensagens') messages(
    @Req() req: SessionRequest,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: MessagePageDto,
  ) {
    return this.service.messages(req.usuarioId, id, query.antes);
  }
  @Post('conversas/:id/mensagens') send(
    @Req() req: SessionRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SendMessageDto,
  ) {
    return this.service.send(req.usuarioId, id, body);
  }
  @Get('contratacoes/anteriores') history(@Req() req: SessionRequest) {
    return this.service.history(req.usuarioId);
  }
}
