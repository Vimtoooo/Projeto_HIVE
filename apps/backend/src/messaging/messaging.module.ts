import { NotificationsModule } from '../notifications/notifications.module';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PersistenciaModule } from '../persistence/persistencia.module';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
@Module({
  imports: [AuthModule, PersistenciaModule, NotificationsModule],
  controllers: [MessagingController],
  providers: [MessagingService],
})
export class MessagingModule {}
