import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PersistenciaModule } from '../persistence/persistencia.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
@Module({
  imports: [AuthModule, PersistenciaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
