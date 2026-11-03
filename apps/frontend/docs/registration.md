# Cadastro de clientes e prestadores — HIVE

## Apresentação e validação dos cadastros

Os dois cadastros compartilham campos pessoais, ícones SVG, placeholders e mensagens por campo. O formulário de prestador usa a largura de 400 px do cadastro de cliente no desktop, mantendo textareas mais altas para textos longos. Login e ambos os cadastros exibem o painel esquerdo acima de 768 px; até essa largura, usam coluna única. O painel do prestador explica as etapas com ilustrações vetoriais, sem depoimentos fictícios.

A validação é própria (`noValidate`), substituindo os balões nativos do navegador. Ao sair de um campo, o erro aparece abaixo dele; durante a correção, é reavaliado. O envio apresenta todos os erros e foca o primeiro campo inválido. Borda vermelha e texto descrevem o problema, com `aria-invalid`, `aria-describedby` e transição de 180 ms, desativada para quem prefere movimento reduzido. Erros gerais da API continuam no alerta do formulário.

O nome aceita letras Unicode, acentos, espaços, hífen e apóstrofos entre partes, como **Ana-Maria D’Ávila**, com 3–191 caracteres. Números, emojis, outros símbolos e separadores isolados são rejeitados no frontend e nos endpoints `POST /clientes` e `POST /prestadores`. Não é obrigatório ter sobrenome. Essa regra não modifica cadastros existentes nem a edição de perfil. Demais limites e exigências permanecem os mesmos.

## Cadastro de prestador

A rota `/cadastro/prestador` permite criar uma nova conta de prestador com seu primeiro serviço. Está acessível pelos links **Sou prestador** no login e **Quero me cadastrar como prestador** no cadastro de cliente. Usa `POST /api/prestadores`, encaminhado pelo proxy ao endpoint existente. Isso permite cadastrar profissionais pela interface sem preencher requisições manualmente.

O formulário organiza os campos obrigatórios em dados pessoais, perfil profissional e primeiro serviço. Segue o contrato atual:

| Campo | Limite |
| --- | --- |
| Nome / endereço | 3–191 / 5–191 caracteres |
| E-mail / senha | E-mail válido até 191; senha de 8 a 128 caracteres |
| CPF / CNPJ / telefone | 11 / 14 / 10–11 dígitos, respectivamente |
| Área de atuação / experiência | 1–191 caracteres cada |
| Certificações | De 1 a 20, uma por linha, até 191 caracteres cada; linhas em branco são ignoradas |
| Título / descrição do serviço | 5–191 / 1–5000 caracteres |
| Preço base | R$ 0,01 a R$ 1.000.000,00, até duas casas decimais |

Documentos e telefone têm máscaras, removidas no envio. O preço usa vírgula para centavos e aceita agrupamento brasileiro opcional (`1.234,56` vira o número JSON `1234.56`); entradas ambíguas como `200.50` são rejeitadas. Não há arredondamento silencioso. A confirmação da senha não é enviada. CPF/CNPJ são verificados por tamanho, sem cálculo de dígitos verificadores, conforme a API.

O cadastro cria conta, perfil e serviço juntos. O formulário bloqueia novos envios enquanto aguarda e preserva os campos após falhas de validação, duplicidade ou conexão. Erros locais direcionam o foco ao primeiro campo inválido; falhas gerais direcionam ao alerta do formulário. Uma resposta válida leva a `/login`; não há login automático. Se a resposta de sucesso vier malformada, a interface avisa que a conta pode ter sido criada e orienta tentar entrar antes de reenviar.

CNPJ e ao menos uma certificação continuam obrigatórios. Não há preenchimento fictício, conversão de conta existente ou gestão de serviços. Não foi necessária migration. A validação do nome foi reforçada nos dois endpoints de cadastro, conforme descrito acima. Depois de cadastrar, o perfil e o serviço ativos ficam disponíveis em `/profissionais` conforme as regras atuais de visibilidade.

Arquivos principais: `src/components/ProviderRegistrationForm.tsx`, `src/lib/ProviderRegistration.ts`, `src/services/ProviderRegistrationApi.ts` e `src/styles/provider-registration.module.css`.

Verificação: execute os comandos do [guia de testes](../test/README.md#cadastro-de-prestador). Para conferir manualmente com a API real, prepare o banco pelas migrations existentes, inicie backend/frontend, cadastre dados de teste legítimos, entre com a conta e busque seu nome em `/profissionais`. Esse roteiro grava no banco selecionado; prefira ambiente de testes.

## O que essa funcionalidade faz

A tela de registro (`/cadastro`, componente RegistrationForm.tsx) permite que um novo cliente crie uma conta no HIVE.

**Fluxo completo:**
1. O usuário preenche o formulário de cadastro (nome, CPF, telefone, endereço, e-mail, senha e confirmação de senha).
2. O front-end valida os dados (CPF com 11 dígitos, telefone com 10 ou 11 dígitos, senha com no mínimo 8 caracteres e senhas iguais).
3. Os dados são enviados para o backend (`POST /clientes`), que salva o novo usuário no banco de dados.
4. Se o cadastro der certo, o usuário é redirecionado para a **tela de login** (`/login`).
5. Ao fazer login com o e-mail e senha recém-criados, o sistema (fluxo que já existia antes) redireciona o usuário para a **home page** (`/home`).

Ou seja: **registro → login → home**, como foi pedido.

## Linha do tempo das modificações

### 1. Criação da tela de registro (front-end)

Registro histórico: a primeira versão era HTML/JavaScript. Nesta etapa foi
substituída por RegistrationForm.tsx, ApiClient.ts e FormValidation.ts.
- Foi criado o arquivo `apps/frontend/src/legacy/pages/register.html`, reaproveitando o mesmo layout visual e o mesmo CSS (`Loguin.css`) já usado na tela de login, pra manter a identidade visual do HIVE.
- Foi criado `apps/frontend/src/legacy/scripts/register.js`, responsável por:
  - Aplicar máscara de CPF e telefone enquanto o usuário digita.
  - Validar os campos antes de enviar.
  - Fazer a requisição `POST` para o backend.
  - Mostrar mensagem de erro na tela se algo falhar (ex: e-mail já cadastrado).
  - Redirecionar para a tela de login (`/login`) quando o cadastro é concluído com sucesso.

### 2. Identificação de que faltava uma rota no backend
Ao revisar o backend, percebemos que só existiam as rotas `POST /login` (login) e `POST /prestadores` (cadastro de prestador de serviço). **Não existia nenhuma rota para cadastrar um cliente.**

### 3. Criação da rota de cadastro de cliente (backend)
Essa parte foi feita **com apoio de IA**, já que envolve lógica de backend e banco de dados — algo fora do que sei fazer sozinho no momento (meu foco até aqui foi front-end).

Foram criados 4 arquivos novos, dentro de uma pasta nova `apps/backend/src/cliente/`:

| Arquivo | O que faz |
| --- | --- |
| `cliente.dto.ts` | Define e valida os dados que chegam do formulário (nome, e-mail, senha, telefone, CPF, endereço) |
| `cliente.service.ts` | Contém a lógica de cadastro: monta um novo usuário do tipo "Contratante" e usa a função `criarUsuario`, que já existia no repositório do banco de dados, para salvar |
| `cliente.controller.ts` | Cria a rota `POST /clientes`, que recebe a requisição do front-end |
| `cliente.module.ts` | Junta os três arquivos acima em um módulo do NestJS |

Importante: **não foi criada nenhuma tabela nova no banco**. A tabela `Usuario` já existia (é a mesma usada no login e no cadastro de prestador) e já tinha um método pronto (`criarUsuario`) para salvar um cliente — só faltava a rota que chamasse esse método.

### 4. Registro do novo módulo
O arquivo `apps/backend/src/app.module.ts` foi atualizado para incluir o `ClienteModule` na lista de módulos do sistema, junto dos que já existiam (`AuthModule`, `CatalogoModule`).

### 5. Verificação do CORS
Foi confirmado que o backend permite requisições vindas do front-end mesmo rodando em portas diferentes (modo estático na porta 5500, backend na porta 3000; no Next.js, porta 3001 com proxy /api), usando `app.enableCors()` no `main.ts`.

## Caminhos dos arquivos (para referência)

```text
apps/frontend/src/
├── app/cadastro/page.tsx
├── components/RegistrationForm.tsx
├── services/ApiClient.ts
├── lib/FormValidation.ts
├── types/ApiTypes.ts
└── styles/auth-page.module.css
```

O backend mantém src/cliente com DTO, serviço, controller e módulo descritos acima.

## Como testar depois do `git pull`

Como cada integrante tem o próprio banco de dados local (o `.env` não é versionado no Git), é preciso confirmar alguns pontos antes de testar:

1. `git pull` para trazer os arquivos novos.
2. Ter o arquivo `.env/.env` já configurado com a `DATABASE_URL` do seu banco local (se o login já funciona na sua máquina, isso já está configurado).
3. **Não é necessário rodar nenhuma migration nova** — a tabela `Usuario` já existia e já suportava esse tipo de cadastro.
4. Rodar o backend:
   ```powershell
   cd apps/backend
   $env:DOTENV_CONFIG_PATH = '.env/.env'
   $env:PORT = '3000'
   npm run start:dev
   ```
5. Confirmar no terminal que a rota `POST /clientes` aparece no mapeamento de rotas do NestJS.
6. Rodar o front-end com um servidor local (não abrir o HTML direto):
   ```powershell
   cd apps/frontend
   npm ci
   npm run dev
   ```
7. Acessar `http://localhost:3001/cadastro` e testar o cadastro.
8. Fazer login com o e-mail e senha cadastrados e confirmar o redirecionamento até a home.

## Observações

- O ambiente atual é 100% local (`localhost`) — ainda não há servidor externo.
- A Home já oferece catálogo ilustrativo, mensagens com profissionais cadastrados e histórico de serviços concluídos; veja [home.md](home.md).
- Qualquer erro de CORS ou de conexão aparece no console do navegador (F12 → aba Console ou Network) e ajuda a identificar se o problema é no front ou no backend.
## Organização e integração com Next.js

O formulário é um Client Component em src/components/RegistrationForm.tsx.
React controla eventos e estado; FormValidation.ts aplica máscaras e validações.
ApiClient.ts envia POST /api/clientes e valida a resposta em execução. O proxy
encaminha ao NestJS; confirmação de senha não é enviada. CSS Modules preservam
o visual com escopo por tela. Não existe mais cópia de HTML para public.

Veja o [README](../README.md) e os [testes](../test/README.md).

### Ajuste visual de login e cadastro de cliente (02/11/2026)

O login usa espaçamentos próprios, adaptados à altura disponível, sem alterar as dimensões dos campos dos cadastros. Foi verificado sem rolagem vertical entre 320 × 568 e 1440 × 900 px, incluindo o alerta de credenciais inválidas. Não há bloqueio de rolagem: zoom, teclado virtual ou mensagens excepcionalmente longas continuam permitindo acessar todo o conteúdo.

O painel esquerdo do cadastro de cliente substitui o depoimento por uma ilustração de colmeia e três etapas: encontrar profissionais, comparar serviços e conversar para combinar os detalhes. Reutiliza o estilo do painel do prestador, sem avaliações ou promessas fictícias. Permanece oculto até 768 px. A preferência por movimento reduzido também desativa as animações dos campos.

O painel do prestador acompanha a extensão do formulário com orientações ilustradas para apresentar experiência e certificações, descrever o primeiro serviço e alinhar o atendimento por mensagem. Inclui cuidado com dados pessoais e um fechamento visual, sem métricas, depoimentos ou promessas fictícias. O conteúdo complementar é exclusivo desse cadastro e permanece oculto no celular.

### Alinhamento entre telas de autenticação

Login e cadastros usam as mesmas posições de navegação, logo, título e descrição do painel esquerdo. O início dos formulários compartilha uma posição responsiva pela altura da janela, sem depender do tamanho total de cada formulário. Margens do logo e etiqueta de boas-vindas também são compartilhadas. A área de rolagem reserva uma largura estável nessas páginas para evitar deslocamentos horizontais ao trocar entre login e cadastro; o login continua sem rolagem nas dimensões verificadas. Em telas estreitas, o link superior usa tamanho ajustado para não sobrepor Voltar.


## Evolução planejada: conta única

O [plano de conta única](../../backend/docs/CONTA-UNICA.md) propõe permitir que profissionais também contratem serviços e que clientes ativem a atuação profissional sem criar outra identidade. Inclui regras de negócio, transição de contas existentes, sessão, convite e critérios de aceite. **Ainda não implementado:** os contratos e as restrições atuais descritos neste guia continuam válidos até a entrega desse requisito.
