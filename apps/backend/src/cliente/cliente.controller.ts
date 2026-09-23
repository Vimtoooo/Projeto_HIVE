import { Body, Controller, Post } from '@nestjs/common';
import { ClienteService } from './cliente.service';
import { CadastroClienteDto } from './cliente.dto';

@Controller('clientes')
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  @Post()
  async cadastrar(@Body() dados: CadastroClienteDto) {
    return this.clienteService.cadastrar(dados);
  }
}