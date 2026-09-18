import { Module } from '@nestjs/common';

import { PersistenciaModule } from '../persistence/persistencia.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [PersistenciaModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}