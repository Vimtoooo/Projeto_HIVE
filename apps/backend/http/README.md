# Requisições HTTP do HIVE

Exemplos para a extensão REST Client (Huachao Mao) do VS Code. Contêm apenas
valores fictícios e podem ser versionados. A senha dos exemplos é da conta
fictícia do prestador, não a senha de conexão com o MySQL.

## Executar

1. Configure o banco exclusivo e `.env.test.local` conforme o [guia de testes](../test/README.md).
2. Na pasta `apps/backend`, execute:

   ```powershell
   npm run prisma:generate
   npm run test:db:prepare
   npm run start:demo
   ```

3. Mantenha o terminal da API aberto. Abra um `.http` e clique em **Send Request**
   sobre a requisição desejada. Execute um bloco por vez, separado por `###`.
4. Confira status e corpo no painel de resposta. Se mudar a porta da API,
   atualize `@baseUrl` no início de cada arquivo.

| Arquivo | Finalidade |
| --- | --- |
| [services.http](services.http) | Verificar a API e consultar serviços com filtros e paginação |
| [providers.http](providers.http) | Criar um prestador com serviço e buscar o resultado por UUID ou ID |
| [validation.http](validation.http) | Enviar entradas inválidas e observar respostas 400, sem novos cadastros |

A URL não determina qual banco será usado: isso depende de como o backend foi
iniciado. `start:demo` usa TEST_DATABASE_URL; `start:dev` usa DATABASE_URL.
Para estes exemplos, use **start:demo**, evitando gravar no banco principal.

## Conexão recusada no REST Client

Confira se `@baseUrl` usa a mesma porta da API. Os exemplos estão configurados
para `http://localhost:3333`, correspondente ao PORT do ambiente local atual.
Em outra máquina, ajuste essa linha em cada `.http` conforme a porta utilizada.

Se ocorrer RequestError, mantenha `npm run start:demo` rodando no terminal e
abra `http://localhost:3333/` no navegador. A resposta esperada é Hello World!.
Se funcionar, mas o REST Client falhar, confira a URL do arquivo e as opções
de proxy do VS Code. Preparar as tabelas ou executar testes não mantém a API
ligada: é necessário executar um comando de inicialização.

## Resultados esperados e repetição

GET retorna 200; uma lista vazia é válida. O primeiro cadastro retorna 201.
Reenviar o mesmo POST retorna 409: o banco não permite email, CPF ou CNPJ repetidos.
Os exemplos de validação devem retornar 400; isso é o comportamento esperado.

O cadastro usa um UUID fixo e documentos fictícios estáveis. Para repetir a
criação com os mesmos valores, limpe primeiro os dados da demonstração:

```powershell
npm run test:persistencia:limpar -- 584d56b5-7ca2-49b5-a296-98f91e0b398d
```

Execute a limpeza em outro terminal do backend com o mesmo banco de testes.
Ela remove o email `api.584d56b5-7ca2-49b5-a296-98f91e0b398d@example.invalid`
e seus registros relacionados. Depois, a busca por UUID deve retornar zero itens.
A limpeza automática das suítes Jest não apaga estes registros manuais.

Se trocar o UUID, use um UUID v4 e altere também CPF/CNPJ para não colidir com
um cadastro anterior. Guarde o UUID usado para a limpeza. A referência ao ID da
resposta funciona somente depois de executar o POST nomeado e receber 201.
Se a resposta mais recente do POST for 409, use a busca por UUID.

## Git e dados locais

Mantenha exemplos compartilhados com dados fictícios. Para alterações pessoais,
use uma cópia `nome.local.http`; esse padrão é ignorado nesta pasta. Arquivos
`.env` também são ignorados. Não coloque senhas reais, tokens ou dados pessoais
nos exemplos versionados nem cole respostas sensíveis no repositório.

Estes arquivos auxiliam testes manuais: não substituem `npm run test:catalogo`,
que verifica automaticamente os resultados e as regras da API.

## O que é a API

A API é a interface HTTP do backend: recebe pedidos do frontend ou do REST
Client, valida entradas, executa regras e acessa o banco pelo Prisma. O cliente
não precisa consultar o MySQL diretamente.

É uma **API HTTP no estilo REST**, com rotas como POST /prestadores e GET
/servicos e dados em JSON. O endpoint básico GET / retorna texto. Ela foi
implementada em NestJS e ainda não possui autenticação ou endpoints de
contratação, pagamento e avaliação.

Veja o [contrato completo](../docs/CATALOGO-API.md) e a
[documentação do REST Client](https://github.com/Huachao/vscode-restclient#usage).
