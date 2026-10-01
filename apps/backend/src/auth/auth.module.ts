import { SessionGuard } from './session.guard';
import { SessionService } from './session.service';
import { Module } from '@nestjs/common';

import { PersistenciaModule } from '../persistence/persistencia.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [PersistenciaModule],
  controllers: [AuthController],
  providers: [AuthService, SessionService, SessionGuard],
  exports: [AuthService, SessionService, SessionGuard],
})
export class AuthModule {}
