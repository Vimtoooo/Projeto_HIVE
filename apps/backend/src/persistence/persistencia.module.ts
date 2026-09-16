import { Inject, Injectable, Module, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { criarPrismaClient } from './prisma-client.factory';
import { PersistenciaService } from './persistencia.service';

@Injectable()
class ConexaoPrisma implements OnModuleDestroy {
  constructor(@Inject(PrismaClient) private readonly prisma: PrismaClient) {}

  async onModuleDestroy(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

@Module({
  providers: [
    { provide: PrismaClient, useFactory: () => criarPrismaClient() },
    {
      provide: PersistenciaService,
      useFactory: (prisma: PrismaClient) => new PersistenciaService(prisma),
      inject: [PrismaClient],
    },
    ConexaoPrisma,
  ],
  exports: [PersistenciaService],
})
export class PersistenciaModule {}
