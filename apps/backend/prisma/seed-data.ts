// Somente dados fictícios. Documentos servem para demonstração, não validação fiscal.
export const SENHA_DEMONSTRACAO = 'HiveDemo!2026';
export const DATA_DEMONSTRACAO = new Date('2026-09-01T12:00:00.000Z');
export const pessoas = [
  {
    nome: 'Ana Souza (Demo)',
    email: 'ana@hive.example.invalid',
    cpf: '90000000001',
    telefone: '11900000001',
    endereco: 'Rua Fictícia, 10',
    perfil: null,
  },
  {
    nome: 'Carlos Lima (Demo)',
    email: 'carlos@hive.example.invalid',
    cpf: '90000000002',
    telefone: '11900000002',
    endereco: 'Rua Fictícia, 20',
    perfil: {
      areaAtuacao: 'Marcenaria',
      experiencia: '5 anos de experiência fictícia',
      certificacoes: ['Montagem de móveis'],
      cnpj: '90000000000002',
      avaliacaoMedia: 5,
    },
  },
  {
    nome: 'Beatriz Santos (Demo)',
    email: 'beatriz@hive.example.invalid',
    cpf: '90000000003',
    telefone: '11900000003',
    endereco: 'Rua Fictícia, 30',
    perfil: {
      areaAtuacao: 'Jardinagem',
      experiencia: '3 anos de experiência fictícia',
      certificacoes: ['Cuidados com jardins'],
      cnpj: '90000000000003',
      avaliacaoMedia: 0,
    },
  },
];
export const servicos = [
  {
    titulo: 'Montagem de estante',
    descricao: 'Montagem de uma estante residencial.',
    precoBase: 150,
    prestador: 'carlos@hive.example.invalid',
    ativo: true,
  },
  {
    titulo: 'Manutenção de jardim',
    descricao: 'Poda leve e limpeza de um jardim pequeno.',
    precoBase: 120,
    prestador: 'beatriz@hive.example.invalid',
    ativo: true,
  },
  {
    titulo: 'Restauração de mesa',
    descricao:
      'Serviço temporariamente indisponível para demonstrar o filtro de ativos.',
    precoBase: 250,
    prestador: 'carlos@hive.example.invalid',
    ativo: false,
  },
];
