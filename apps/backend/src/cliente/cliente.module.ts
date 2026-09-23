import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../persistence/persistencia.module';
import { ClienteController } from './cliente.controller';
import { ClienteService } from './cliente.service';

@Module({
  imports: [PersistenciaModule],
  controllers: [ClienteController],
  providers: [ClienteService],
})
export class ClienteModule {}