import 'dotenv/config';
import {
  PrismaClient,
  TipoUsuario,
  StatusConta,
  StatusServico,
  StatusContratacao,
  FormaPagamento,
  StatusPagamento,
  TipoRegistro,
} from '@prisma/client';

const prisma = new PrismaClient({
  // @ts-ignore
  db: {
    url: process.env.DATABASE_URL,
  },
});

async function main() {
  // Limpa os dados existentes para evitar erros de duplicidade ao rodar o seed várias vezes
  await prisma.financeiro.deleteMany();
  await prisma.fatura.deleteMany();
  await prisma.avaliacao.deleteMany();
  await prisma.indicacao.deleteMany();
  await prisma.contratacao.deleteMany();
  await prisma.servico.deleteMany();
  await prisma.prestador.deleteMany();
  await prisma.usuario.deleteMany();

  // 1. Criar um usuário que é Prestador de Serviço
  const provider = await prisma.usuario.create({
    data: {
      nome: 'Carlos Marceneiro',
      email: 'carlos@hive.com',
      senha: 'senha_criptografada_aqui',
      telefone: '11999999999',
      cpf: '123.456.789-00',
      endereco: 'Rua das Madeiras, 123',
      tipoUsuario: TipoUsuario.PRESTADOR,
      statusConta: StatusConta.ATIVO,
      prestadorPerfil: {
        create: {
          areaAtuacao: 'Marcenaria',
          experiencia: '10 anos',
          cnpj: '12.345.678/0001-00',
          certificacoes: ['MarcenariaAvançada'],
          servicos: {
            create: {
              titulo: 'Restauração de Móveis Antigos',
              descricao:
                'Especialista em restauração de móveis de madeira maciça.',
              precoBase: 250.0,
            },
          },
        },
      },
    },
    include: { prestadorPerfil: { include: { servicos: true } } },
  });

  // 2. Criar um usuário que é Cliente
  const client = await prisma.usuario.create({
    data: {
      nome: 'Ana Souza',
      email: 'ana.souza@email.com',
      senha: 'outra_senha_segura',
      telefone: '11988888888',
      cpf: '987.654.321-11',
      endereco: 'Avenida Brasil, 456',
      tipoUsuario: TipoUsuario.CONTRATANTE,
      statusConta: StatusConta.ATIVO,
    },
  });

  // 3. Criar uma Contratação de exemplo (Fluxo Completo)
  const service = provider.prestadorPerfil!.servicos[0];

  const contract = await prisma.contratacao.create({
    data: {
      contratanteId: client.idUsuario,
      servicoId: service.idServico,
      valor: service.precoBase,
      status: StatusContratacao.EM_ANDAMENTO,
      formaPagamento: FormaPagamento.PIX,
      dataVencimento: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 dias a partir de hoje

      // Criar fatura vinculada automaticamente
      fatura: {
        create: {
          valorTotal: service.precoBase,
          statusPagamento: StatusPagamento.PENDENTE,
          usuarioId: client.idUsuario,
        },
      },

      // Criar registro financeiro inicial
      financeiros: {
        create: {
          tipoRegistro: TipoRegistro.RECEITA,
          valor: service.precoBase,
          descricao: `Contratação inicial: ${service.titulo}`,
        },
      },
    },
    include: {
      fatura: true,
      financeiros: true,
    },
  });

  // 4. Registrar uma indicação
  await prisma.indicacao.create({
    data: {
      indicadorId: client.idUsuario,
      indicadoId: provider.prestadorPerfil!.idPrestador,
      meioIndicacao: 'WHATSAPP',
      observacao: 'Cliente veio através de recomendação no grupo do bairro',
      statusIndicacao: 'PENDENTE',
    },
  });

  console.log('--- Dados de Teste Populados ---');
  console.log(`Prestador: ${provider.nome} | Cliente: ${client.nome}`);
  console.log(`Contrato de ${service.titulo} gerado com sucesso!`);
  console.log('Seed finalizado com sucesso! 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
