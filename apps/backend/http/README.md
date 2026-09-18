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
| [services.http](services.http) | 30 consultas: disponibilidade, filtros, limites e paginação |
| [providers.http](providers.http) | 30 requisições: dez cadastros, dez consultas e dez duplicidades |
| [validation.http](validation.http) | 30 entradas inválidas: quinze consultas e quinze cadastros (HTTP 400) |

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

São **90 requisições prontas**, com status esperado indicado em cada bloco.
Execute na seguinte ordem, em um banco de testes sem este lote cadastrado:

1. **providers.http:** execute os 30 blocos na ordem. Cada grupo cadastra um
   prestador (201), consulta seu serviço (200) e repete o cadastro (409).
   Ao final, haverá dez novos usuários, dez prestadores e dez serviços.
2. **services.http:** execute as 30 consultas. Os totais indicados dependem
   dos dez cadastros anteriores e incluem filtros por área, preço e paginação.
3. **validation.http:** execute os 30 casos inválidos. Todos devem retornar
   400 e não devem criar registros; podem ser executados independentemente.

O comentário `expectedCount` indica o campo **total** da resposta, não o
comprimento de `itens`: uma página além do fim pode ter itens vazios e total 10.
Os comentários documentam expectativas; o REST Client não os verifica sozinho.
Confira o status e o corpo retornados após clicar em **Send Request**.

Os cadastros cobrem preços mínimo/máximo, telefone de dez e onze dígitos,
acentos, normalização de nome/email, senha mínima, vinte certificações e
um título com 191 caracteres. As consultas incluem resultados vazios e
limites de paginação; os erros incluem campos ausentes ou inválidos,
propriedades extras e parâmetros repetidos.

### Limpar e repetir

Os três arquivos usam o mesmo UUID fixo e documentos fictícios estáveis.
Para repetir desde o primeiro cadastro, execute em outro terminal do backend:

```powershell
npm run test:persistencia:limpar -- 35b612d3-d246-4ec7-9eb2-24fb697dc0dd
```

A limpeza usa o banco de testes configurado e remove os emails exatos
`api-http01.UUID@example.invalid` até `api-http10.UUID@example.invalid`
e seus vínculos. Também contempla o email reservado aos casos inválidos.
Depois, a consulta por UUID deve retornar total zero. A limpeza das suítes
Jest não remove automaticamente este lote manual.

Sem limpar, repetir um cadastro já realizado retorna 409, inclusive no bloco
que originalmente esperava 201. Se interromper a demonstração, limpe o lote
e reinicie a sequência para recuperar os totais esperados.

Cada integrante deve preferir seu próprio banco de testes. Se compartilharem
o mesmo banco, combinem a execução e a limpeza, pois utilizam o mesmo lote.
Para personalizar, altere o UUID v4 nos três arquivos e também CPF/CNPJ dos
cadastros, mantendo as repetições de cada prestador iguais. Guarde o UUID
para a limpeza. Não basta trocar apenas o UUID para evitar documentos duplicados.

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
