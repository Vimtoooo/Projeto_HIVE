import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BuscarServicosDto } from './catalogo.dto';
import { ServicoService } from './servico.service';
import { ServicoRepository } from './servico.repository';

describe('Serviço de catálogo: erros de infraestrutura', () => {
  it('não expõe mensagens do driver ou credenciais quando o banco falha', async () => {
    const erro = new Error('mensagem interna confidencial do driver');
    erro.name = 'DriverAdapterError';
    const consultarServicos = jest.fn().mockRejectedValue(erro);
    const modulo = await Test.createTestingModule({
      providers: [
        ServicoService,
        { provide: ServicoRepository, useValue: { consultarServicos } },
      ],
    }).compile();
    const servico = modulo.get(ServicoService);
    await expect(
      servico.buscarServicos(new BuscarServicosDto()),
    ).rejects.toEqual(
      new ServiceUnavailableException(
        'Banco de dados indisponível. Tente novamente mais tarde.',
      ),
    );
    await modulo.close();
  });
});
