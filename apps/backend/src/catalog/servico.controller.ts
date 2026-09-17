import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BuscarServicosDto, CadastroPrestadorDto } from './catalogo.dto';
import { ServicoService } from './servico.service';

@Controller()
export class ServicoController {
  constructor(private readonly servicos: ServicoService) {}

  @Get('servicos')
  buscarServicos(@Query() filtro: BuscarServicosDto) {
    return this.servicos.buscarServicos(filtro);
  }

  @Post('prestadores')
  cadastrarPrestador(@Body() dados: CadastroPrestadorDto) {
    return this.servicos.cadastrarPrestador(dados);
  }
}
