import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../persistence/persistencia.module';
import { ServicoController } from './servico.controller';
import { ServicoService } from './servico.service';
import { ServicoRepository } from './servico.repository';

@Module({
  imports: [PersistenciaModule],
  controllers: [ServicoController],
  providers: [ServicoService, ServicoRepository],
})
export class CatalogoModule {}
