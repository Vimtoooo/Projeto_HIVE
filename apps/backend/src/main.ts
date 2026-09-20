import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap().catch(() => {
  console.error(
    'Não foi possível iniciar a API. Confira a configuração local.',
  );

  process.exitCode = 1;
});
