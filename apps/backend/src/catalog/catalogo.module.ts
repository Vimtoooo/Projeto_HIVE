import { AuthModule } from '../auth/auth.module';
import { AtivacaoPrestadorService } from './ativacao-prestador.service';
import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../persistence/persistencia.module';
import { ServicoController } from './servico.controller';
import { ServicoService } from './servico.service';
import { ServicoRepository } from './servico.repository';

@Module({
  imports: [PersistenciaModule, AuthModule],
  controllers: [ServicoController],
  providers: [ServicoService, ServicoRepository, AtivacaoPrestadorService],
})
export class CatalogoModule {}
