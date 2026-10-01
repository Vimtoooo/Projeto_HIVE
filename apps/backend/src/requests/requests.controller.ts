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
import { RequestsService } from './requests.service';
import {
  CreateRequestDto,
  RequestActionDto,
  RequestQueryDto,
} from './requests.dto';
@Controller('solicitacoes')
@UseGuards(SessionGuard)
export class RequestsController {
  constructor(private readonly service: RequestsService) {}
  @Get() list(@Req() req: SessionRequest, @Query() q: RequestQueryDto) {
    return this.service.list(req.usuarioId, q);
  }
  @Get(':id') detail(
    @Req() req: SessionRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.detail(req.usuarioId, id);
  }
  @Post() create(@Req() req: SessionRequest, @Body() body: CreateRequestDto) {
    return this.service.create(req.usuarioId, body);
  }
  @Post(':id/acao') act(
    @Req() req: SessionRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RequestActionDto,
  ) {
    return this.service.act(req.usuarioId, id, body.acao);
  }
  @Post(':id/conversa') conversation(
    @Req() req: SessionRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.conversation(req.usuarioId, id);
  }
}
