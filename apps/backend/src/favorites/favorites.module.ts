import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PersistenciaModule } from '../persistence/persistencia.module';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
@Module({
  imports: [AuthModule, PersistenciaModule],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
