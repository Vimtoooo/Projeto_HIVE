import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RepositorioDominio } from './repositorio-dominio';

@Injectable()
export class PersistenciaService {
  constructor(private readonly prisma: PrismaClient) {}

  /** Um erro propagado pelo callback desfaz todos os inserts da operação. */
  executar<T>(
    operacao: (repositorio: RepositorioDominio) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(
      (tx) => operacao(new RepositorioDominio(tx)),
      { maxWait: 5000, timeout: 15000 },
    );
  }
}
