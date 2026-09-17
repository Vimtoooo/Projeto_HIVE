import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PersistenciaModule } from './persistence/persistencia.module';
import { CatalogoModule } from './catalogo/catalogo.module';

@Module({
  imports: [PersistenciaModule, CatalogoModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          transform: true,
          whitelist: true,
          forbidNonWhitelisted: true,
          validationError: { target: false, value: false },
        }),
    },
  ],
})
export class AppModule {}
