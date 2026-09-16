import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PersistenciaModule } from './persistence/persistencia.module';

@Module({
  imports: [PersistenciaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
