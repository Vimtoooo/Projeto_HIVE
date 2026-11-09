import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BuscarServicosDto, CadastroPrestadorDto } from './catalogo.dto';
import { SessionGuard } from '../auth/session.guard';
import type { SessionRequest } from '../auth/session.service';
import { AtivacaoPrestadorService } from './ativacao-prestador.service';
import { PerfilProfissionalDto } from './catalogo.dto';
import { ServicoService } from './servico.service';

@Controller()
export class ServicoController {
  constructor(
    private readonly servicos: ServicoService,
    private readonly ativacao: AtivacaoPrestadorService,
  ) {}

  @Post('perfil/prestador')
  @UseGuards(SessionGuard)
  ativar(@Req() req: SessionRequest, @Body() dados: PerfilProfissionalDto) {
    return this.ativacao.ativar(req.usuarioId, dados);
  }

  @Get('servicos')
  buscarServicos(@Query() filtro: BuscarServicosDto) {
    return this.servicos.buscarServicos(filtro);
  }

  @Post('prestadores')
  cadastrarPrestador(@Body() dados: CadastroPrestadorDto) {
    return this.servicos.cadastrarPrestador(dados);
  }
}
