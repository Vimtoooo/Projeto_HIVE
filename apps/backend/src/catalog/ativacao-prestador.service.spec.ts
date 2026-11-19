import { ServiceUnavailableException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { AtivacaoPrestadorService } from './ativacao-prestador.service';
import { PerfilProfissionalDto } from './catalogo.dto';

describe('Ativação: conflitos transitórios', () => {
  const conflito = () =>
    new Prisma.PrismaClientKnownRequestError('conflito', {
      code: 'P2034',
      clientVersion: '7.10.0',
    });
  it('repete conflitos de serialização e devolve a confirmação da transação concluída', async () => {
    const resultado = { idServico: 1 };
    const transaction = jest
      .fn()
      .mockRejectedValueOnce(conflito())
      .mockRejectedValueOnce(conflito())
      .mockResolvedValue(resultado);
    const service = new AtivacaoPrestadorService({
      $transaction: transaction,
    } as unknown as PrismaClient);
    await expect(
      service.ativar(1, new PerfilProfissionalDto()),
    ).resolves.toEqual(resultado);
    expect(transaction).toHaveBeenCalledTimes(3);
  });
  it('limita a três tentativas e devolve falha recuperável sem expor detalhes internos', async () => {
    const transaction = jest.fn().mockRejectedValue(conflito());
    const service = new AtivacaoPrestadorService({
      $transaction: transaction,
    } as unknown as PrismaClient);
    await expect(
      service.ativar(1, new PerfilProfissionalDto()),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(transaction).toHaveBeenCalledTimes(3);
  });
});
