import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PersistenciaModule } from '../persistence/persistencia.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
@Module({
  imports: [AuthModule, PersistenciaModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
