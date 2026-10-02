import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard';
import type { SessionRequest } from '../auth/session.service';
import { FavoriteBodyDto, FavoriteIdDto } from './favorites.dto';
import { FavoritesService } from './favorites.service';
@Controller('favoritos')
@UseGuards(SessionGuard)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}
  @Get() list(@Req() req: SessionRequest) {
    return this.favorites.list(req.usuarioId);
  }
  @Put(':prestadorId') save(
    @Req() req: SessionRequest,
    @Param() params: FavoriteIdDto,
    @Body() _body: FavoriteBodyDto,
  ) {
    void _body; // Empty DTO rejects client-supplied account identifiers.
    return this.favorites.save(req.usuarioId, params.prestadorId);
  }
  @Delete(':prestadorId') remove(
    @Req() req: SessionRequest,
    @Param() params: FavoriteIdDto,
    @Body() _body: FavoriteBodyDto,
  ) {
    void _body;
    return this.favorites.remove(req.usuarioId, params.prestadorId);
  }
}
