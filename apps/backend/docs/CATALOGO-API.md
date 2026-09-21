# Cadastro e busca no backend real

O AppModule carrega CatalogoModule. O fluxo segue o diagrama:
`ServicoController → ServicoService → ServicoRepository → Prisma → PostgreSQL`.
O retorno percorre o caminho inverso em JSON. O cadastro usa as classes
Prestador e Servico, com a transação de PersistenciaService já existente.

Escopo: **cadastro de prestador com serviço inicial e busca**. A tela estática
de login ainda não consome esses endpoints. Contratação, pagamento, avaliação
e autenticação não são endpoints desta entrega.

## Configurar e iniciar

Execute na pasta `apps/backend`: `npm ci` e `npm run prisma:generate`.
Crie manualmente `.env/.env` com os valores locais:

```dotenv
DATABASE_URL="postgresql://SEU_USUARIO:SUA_SENHA@localhost:5432/hive"
PORT=3000
```

Os arquivos `.env`, `.env.test.local` e os modelos `.env.*.example` não são
distribuídos no Git. Use os exemplos fictícios desta documentação. Codifique
caracteres especiais da senha na URL; nunca inclua credenciais reais em commits.

O adaptador atual é `@prisma/adapter-pg`; as configurações RSA do MySQL não se aplicam.
Defina `DOTENV_CONFIG_PATH=.env/.env` no terminal conforme o README do backend.

Para a API normal, prepare o schema do banco `DATABASE_URL` revisando as
alterações (`npx prisma db push`, sem aceitar perda de dados) e execute
`npm run start:dev`. As rotas leem e gravam nesse banco. Para demonstrações, use o seed local protegido descrito no README do Prisma.

## POST /prestadores

Cria **uma conta, o perfil de prestador e o primeiro serviço juntos**. Não
reutiliza uma conta existente. Email, CPF ou CNPJ duplicados retornam 409 e
desfazem a transação. A senha é armazenada como hash scrypt com salt aleatório.

Exemplo fictício do corpo JSON (`Content-Type: application/json`):

```json
{
  "nome": "Prestador Fictício",
  "email": "prestador.demo@example.invalid",
  "senha": "SenhaFicticia!123",
  "telefone": "11999990000",
  "cpf": "12345678901",
  "endereco": "Rua de Testes, 100",
  "areaAtuacao": "Montagem",
  "experiencia": "Montagem de móveis",
  "certificacoes": ["Montagem de móveis"],
  "cnpj": "12345678000199",
  "servico": {
    "titulo": "Montagem de mesa",
    "descricao": "Montagem de mesa e cadeira",
    "precoBase": 200
  }
}
```

Resposta 201: `idServico`, `titulo`, `descricao`, `precoBase` e `prestador`
contendo `idPrestador`, `nome`, `areaAtuacao` e `avaliacaoMedia`. Os IDs vêm do
banco. Senha, email, CPF, CNPJ, telefone e endereço não são retornados.

Telefone e documentos devem conter somente dígitos. CPF/CNPJ mantêm a validação
de tamanho das classes, sem verificação fiscal. Preço: número JSON positivo,
até 1.000.000 e no máximo duas casas decimais. Campos extras, inclusive status
e IDs enviados pelo cliente, são rejeitados com 400.

## GET /servicos

Exemplo: `http://localhost:3000/servicos?texto=mesa&precoMax=250&pagina=1&limite=20`.

| Filtro | Regra |
| --- | --- |
| `texto` | Trecho do título ou descrição; até 191 caracteres |
| `areaAtuacao` | Trecho da área do prestador |
| `precoMin`, `precoMax` | Valores inclusivos; mínimo não pode exceder máximo |
| `prestadorId` | ID positivo do prestador |
| `pagina` | Inteiro entre 1 e 100.000; padrão 1 |
| `limite` | Inteiro entre 1 e 100; padrão 20 |

Resposta 200: `{ "itens": [...], "total": 1, "pagina": 1, "limite": 20 }`.
Sem resultados, `itens` fica vazio. Ordenação por `idServico` crescente. Somente
serviços ATIVOS de contas ATIVAS aparecem. Filtros são combinados por AND;
`texto` compara título OU descrição. Maiúsculas e acentos seguem a collation
do banco, que deve ser revisada na migração ao PostgreSQL.

Falhas de conexão retornam 503 com mensagem genérica, sem dados do driver.
Falhas inesperadas retornam 500. A validação de entrada retorna 400.

## Apresentação para o grupo e o professor

Prepare o banco exclusivo conforme o [README dos testes](../test/README.md).
Todos os comandos abaixo devem rodar na pasta `apps/backend`:

```powershell
npm run prisma:generate
npm run test:db:prepare
npm run test:catalogo
```

Esperado: **10 testes aprovados**, usando HTTP e PostgreSQL reais. Os dados da execução
são removidos ao terminar. O arquivo é
[`catalogo.integration-spec.ts`](../test/catalogo.integration-spec.ts).

Para preservar os dados para consulta:

```powershell
npm run test:catalogo:visualizar
```

Esperado: **1 aprovado e 9 pulados intencionalmente**. O teste executa POST e
GET, verifica o banco e o hash, imprime UUID e IDs. Ficam 1 Usuario, 1 Prestador
e 1 Servico fictícios. Guarde o UUID mostrado no terminal.

Em outro terminal, inicie a **aplicação real no banco de testes**:

```powershell
npm run start:demo
```

Esse comando carrega `.env.test.local`, exige banco terminado em `_test`,
distinto do principal, e configura `DATABASE_URL` só no processo filho.
Ele não altera `.env`. Se a porta estiver ocupada, use `$env:PORT = '3001'`
no terminal da API e ajuste a URL.

No navegador abra `http://localhost:3000/servicos?texto=UUID_DA_EXECUCAO`,
substituindo o marcador. É a busca do diagrama pelo backend real lendo o
serviço que o teste inseriu.

No Workbench, selecione o banco `_test` correto e execute, substituindo o UUID:

```sql
SET @email = 'api.UUID_DA_EXECUCAO@example.invalid';
SELECT u.idUsuario, u.nome, p.idPrestador, p.areaAtuacao,
       s.idServico, s.titulo, s.precoBase, s.status
FROM Usuario u
JOIN Prestador p ON p.idPrestador = u.idUsuario
JOIN Servico s ON s.prestadorId = p.idPrestador
WHERE u.email = @email;
```

Ao terminar, pare a API com Ctrl+C e limpe somente essa execução:

```powershell
npm run test:persistencia:limpar -- UUID_DA_EXECUCAO
```

Não use TRUNCATE. A limpeza por UUID não remove cadastros manuais feitos com
outros emails. Os testes normais também não removem demonstrações anteriores.

## Limites e verificações

Novos cadastros ficam ativos nesta versão acadêmica. Antes da exposição em
produção, faltam autenticação, autorização, aprovação e limitação de requisições.
Não há rota para adicionar serviços a uma conta existente sem autenticação.

```powershell
npm run lint:check
npx tsc --project test/tsconfig.json
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run test:persistencia
npm run test:catalogo
```

O lint continua verificando os models: foram corrigidos formatação, cast
desnecessário e conversão explícita de Date, mantendo as regras habilitadas.
Se o VS Code mantiver avisos antigos, execute `ESLint: Restart ESLint Server`
e `TypeScript: Restart TS Server` pela paleta de comandos.
