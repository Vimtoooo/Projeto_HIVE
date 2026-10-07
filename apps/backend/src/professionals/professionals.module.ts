import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../persistence/persistencia.module';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsService } from './professionals.service';
@Module({
  imports: [PersistenciaModule],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService],
})
export class ProfessionalsModule {}
