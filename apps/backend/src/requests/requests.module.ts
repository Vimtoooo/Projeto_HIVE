import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PersistenciaModule } from '../persistence/persistencia.module';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
@Module({
  imports: [AuthModule, PersistenciaModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
